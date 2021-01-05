/* eslint-disable */
/* istanbul ignore file */

import { slice, copy, alloc, from } from './node/buffer';

const toHex = (num: number) => {
  let n = num.toString(16).toUpperCase();
  for (let i = 2 - n.length; i > 0; i -= 1) {
    n = `0${n}`;
  }

  return `0x${n}`;
};

// Parser states
const FILE_START = 0; // start of the file, read signature (FF)
const FILE_START_FF = 1; // start of the file, read signature (D8)
const SEGMENT_START = 2; // start of a segment, expect to read FF
const SEGMENT_MARKER = 3; // read marker ID
const SEGMENT_LENGTH = 4; // read segment length (2 bytes total)
const SEGMENT_IGNORE = 5; // read segment and ignore it
const SEGMENT_PIPE = 6; // read segment and pass it into output
const SEGMENT_PIPE_DATA = 7; // read segment and pass it into output (data)
const SEGMENT_BUFFER = 8; // buffer segment, process as exif
const SEGMENT_BUFFER_DATA = 9; // buffer segment, process as exif
const IMAGE = 10; // start reading image
const IMAGE_FF = 11; // process possible segment inside image
const FINAL = 12; // ignore the rest of the data

export interface JpegFilterOptions {
  removeICCandAPP?: boolean; // remove some application data like photoshop etc
  removeImage?: boolean; // remove image data
  comment?: string | null; // add comment
  filter?: boolean; // enable filters
  removeExif?: boolean; // filter exif data
  removeComments?: boolean; // filter comments
}

/**
 * Filter JPEG Image
 */
export class JpegFilter {
  public output: any;
  private state = FILE_START;

  private removeICCandAPP: boolean = false;
  private removeImage: boolean = false;
  private comment: string | null = null;
  private filter: boolean = true;
  private removeExif: boolean = true;
  private removeComments: boolean = true;

  private markerCode: number = 0;
  private bytesLeft: number = 0;
  private segmentLength: number = 0;
  private app1buffer: any = null;
  private app1pos: number = 0;
  private bytesRead: number = 0;

  /**
   * Setup jpeg filter
   *
   * @param options
   */
  constructor(options: JpegFilterOptions) {
    this.output = [];

    this.state = FILE_START;

    //
    // Parser options
    //

    // remove ICC profile (2-10 kB)
    this.removeICCandAPP = options.removeICCandAPP || false;

    // `true` - remove Exif completely, `false` - filter it and remove thumbnail
    this.removeExif = options.removeExif || false;

    // remove other meta data (XMP, Photoshop, etc.)
    this.filter = options.filter || true;

    // remove JPEG COM segments
    this.removeComments = options.removeComments || true;

    // remove the rest of the image (everything except metadata);
    // if it's `true`, output will be a series of segments, and NOT a valid jpeg
    this.removeImage = options.removeImage || false;

    // add a comment at the beginning of the JPEG
    // (it's added after JFIF, but before anything else)
    this.comment = options.comment || null;
  }

  /**
   * Push file Buffer | Uint8Array
   * @param data
   */
  public push(data: Buffer) {
    let buf;
    let di;
    let i = 0;

    while (i < data.length) {
      let b = data[i];

      switch (
        this.state // eslint-disable-line
      ) {
        // start of the file, read signature (FF)
        case FILE_START:
          if (b !== 0xff) {
            this.error('unknown file format', 'ENOTJPEG');
            return;
          }

          this.state = FILE_START_FF;
          i += 1;
          break;

        // start of the file, read signature (D8)
        case FILE_START_FF:
          if (b !== 0xd8) {
            this.error('unknown file format', 'ENOTJPEG');
            return;
          }

          this.onData(this.buffer([0xff, 0xd8]));
          this.state = SEGMENT_START;
          i += 1;
          break;

        // start of a segment, expect to read FF
        case SEGMENT_START:
          if (this.markerCode === 0xda) {
            // previous segment was SOS, so we should read image data instead
            this.state = IMAGE;
            break;
          }

          if (b !== 0xff) {
            this.error(`unexpected byte at segment start: ${toHex(b)} (offset ${toHex(this.bytesRead + i)} )`, 'EBADDATA');
            return;
          }

          this.state = SEGMENT_MARKER;
          i += 1;
          break;

        // read marker ID
        /* eslint-disable yoda */
        case SEGMENT_MARKER:
          // standalone markers, according to JPEG 1992,
          // http://www.w3.org/Graphics/JPEG/itu-t81.pdf, see Table B.1
          if ((0xd0 <= b && b <= 0xd9) || b === 0x01) {
            this.markerCode = b;
            this.bytesLeft = 0;
            this.segmentLength = 0;

            if (this.markerCode === 0xd9 /* EOI */) {
              this.onData(this.buffer([0xff, 0xd9]));
              this.state = FINAL;
            } else {
              this.state = SEGMENT_LENGTH;
            }

            i += 1;
            break;
          }

          // the rest of the unreserved markers
          if (0xc0 <= b && b <= 0xfe) {
            this.markerCode = b;
            this.bytesLeft = 2;
            this.segmentLength = 0;
            this.state = SEGMENT_LENGTH;
            i += 1;
            break;
          }

          if (b === 0xff) {
            // padding byte, skip it
            i += 1;
            break;
          }

          // unknown markers
          this.error(`unknown marker: ${toHex(b)} (offset ${toHex(this.bytesRead + i)} )`, 'EBADDATA');
          return; // return after error, not break

        // read segment length (2 bytes total)
        case SEGMENT_LENGTH:
          while (this.bytesLeft > 0 && i < data.length) {
            this.segmentLength = this.segmentLength * 0x100 + data[i];
            this.bytesLeft -= 1;
            i += 1;
          }

          if (this.bytesLeft <= 0) {
            if (this.comment !== null && typeof this.comment !== 'undefined' && this.markerCode !== 0xe0) {
              // insert comment field before any other markers (except APP0)
              //
              // (we can insert it anywhere, but JFIF segment being first
              // looks nicer in hexdump)
              //
              let enc;

              try {
                // poor man's utf8 encoding
                enc = unescape(encodeURIComponent(this.comment));
              } catch (err) {
                enc = this.comment;
              }

              buf = this.buffer(5 + enc.length);
              buf[0] = 0xff;
              buf[1] = 0xfe;
              buf[2] = ((enc.length + 3) >>> 8) & 0xff;
              buf[3] = (enc.length + 3) & 0xff;

              /* eslint-disable no-loop-func */
              enc.split('').forEach((c, pos) => {
                buf[pos + 4] = c.charCodeAt(0) & 0xff;
              });

              buf[buf.length - 1] = 0;

              this.comment = null;
              this.onData(buf);
            }

            if (this.markerCode === 0xe0) {
              // APP0, 14-byte JFIF header
              this.state = SEGMENT_PIPE;
            } else if (this.markerCode === 0xe1) {
              // APP1, Exif candidate
              this.state =
                this.filter && this.removeExif
                  ? SEGMENT_IGNORE // ignore if we remove both
                  : SEGMENT_BUFFER;
            } else if (this.markerCode === 0xe2 || this.markerCode === 0xee) {
              // APP2, ICC_profile, APP14
              this.state = this.removeICCandAPP ? SEGMENT_IGNORE : SEGMENT_PIPE;
            } else if (this.markerCode > 0xe2 && this.markerCode < 0xf0) {
              // Photoshop metadata, etc.
              this.state = this.filter ? SEGMENT_IGNORE : SEGMENT_PIPE;
            } else if (this.markerCode === 0xfe) {
              // Comments
              this.state = this.removeComments ? SEGMENT_IGNORE : SEGMENT_PIPE;
            } else {
              // other valid headers
              this.state = this.removeImage ? SEGMENT_IGNORE : SEGMENT_PIPE;
            }

            this.bytesLeft = Math.max(this.segmentLength - 2, 0);
          }
          break;

        // read segment and ignore it
        case SEGMENT_IGNORE:
          di = Math.min(this.bytesLeft, data.length - i);
          i += di;
          this.bytesLeft -= di;

          if (this.bytesLeft <= 0) {
            this.state = SEGMENT_START;
          }

          break;

        // read segment and pass it into output
        case SEGMENT_PIPE:
          if (this.bytesLeft <= 0) {
            this.state = SEGMENT_START;
          } else {
            this.state = SEGMENT_PIPE_DATA;
          }

          buf = this.buffer(4);
          buf[0] = 0xff;
          buf[1] = this.markerCode;
          buf[2] = ((this.bytesLeft + 2) >>> 8) & 0xff;
          buf[3] = (this.bytesLeft + 2) & 0xff;
          this.onData(buf);
          break;

        // read segment and pass it into output
        case SEGMENT_PIPE_DATA:
          di = Math.min(this.bytesLeft, data.length - i);
          this.onData(slice(data, i, i + di));

          i += di;
          this.bytesLeft -= di;

          if (this.bytesLeft <= 0) {
            this.state = SEGMENT_START;
          }

          break;

        // read segment and buffer it, process as exif
        case SEGMENT_BUFFER:
          this.app1buffer = this.buffer(this.bytesLeft);
          this.app1pos = 0;

          this.state = SEGMENT_BUFFER_DATA;
          break;

        // read segment and buffer it, process as exif
        case SEGMENT_BUFFER_DATA:
          di = Math.min(this.bytesLeft, data.length - i);

          const bufSlice = slice(data, i, i + di);

          copy(bufSlice, this.app1buffer, this.app1pos);
          this.app1pos += bufSlice.length;

          i += di;
          this.bytesLeft -= di;

          if (this.bytesLeft <= 0) {
            buf = this.app1buffer;
            this.app1buffer = null;

            if (
              this.markerCode === 0xe1 /* APP1 */ &&
              // compare with 'Exif\0\0'
              buf[0] === 0x45 &&
              buf[1] === 0x78 &&
              buf[2] === 0x69 &&
              buf[3] === 0x66 &&
              buf[4] === 0x00 &&
              buf[5] === 0x00
            ) {
              // do we need this
              // EXIF
              if (this.removeExif) {
                buf = null;
              }
            } else {
              // not EXIF, maybe XMP
              if (this.filter === true) {
                buf = null;
              }
            }

            if (buf) {
              const buf2 = this.buffer(4);

              buf2[0] = 0xff;
              buf2[1] = this.markerCode;
              buf2[2] = ((buf.length + 2) >>> 8) & 0xff;
              buf2[3] = (buf.length + 2) & 0xff;

              this.onData(buf2);
              this.onData(buf);
            }

            this.state = SEGMENT_START;
          }
          break;

        // read image until we get FF
        case IMAGE:
          const start = i;

          while (i < data.length) {
            if (data[i] === 0xff) {
              if (i + 1 < data.length) {
                b = data[i + 1];

                // skip FF and restart markers
                if (b === 0x00 || (b >= 0xd0 && b < 0xd8)) {
                  i += 2;
                  continue;
                }
              }

              break;
            }

            i += 1;
          }

          if (!this.removeImage) {
            this.onData(slice(data, start, i));
          }

          if (i < data.length) {
            this.state = IMAGE_FF;
            i += 1;
          }
          break;

        // process possible segment inside image
        case IMAGE_FF:
          // 00 - escaped FF, D0-D7 - restart markers, FF - just padding
          if (b === 0x00 || (b >= 0xd0 && b < 0xd8) || b === 0xff) {
            if (!this.removeImage) {
              this.onData(this.buffer([255, b]));
            }

            this.state = b === 0xff ? IMAGE_FF : IMAGE;
            i += 1;
            break;
          }

          this.state = SEGMENT_MARKER;
          break;

        // ignore the rest of the data
        case FINAL:
          i += 1;
          break;
      }
    }

    this.bytesRead += data.length;
  }

  public onData(chunk: any) {
    this.output.push(chunk);
  }

  public onError(err: any) {
    throw err;
  }

  public end() {
    switch (this.state) {
      case FILE_START:
      case FILE_START_FF:
      case SEGMENT_IGNORE:
      case SEGMENT_PIPE:
      case SEGMENT_PIPE_DATA:
      case SEGMENT_BUFFER:
      case SEGMENT_BUFFER_DATA:
        // in those 6 states arbitrary data of a fixed length
        // is expected, and we didn't get any
        //
        this.error(`unexpected end of file (offset ${toHex(this.bytesRead)})`, 'EBADDATA');
        break;

      case FINAL:
        break;

      default:
        // otherwise just simulate EOI segment
        //
        this.push(this.buffer([0xff, 0xd9]));
    }
  }

  /**
   * Error handler
   *
   * @param message
   * @param code
   */
  private error(message: string, code: any) {
    if (this.state === FINAL) {
      return;
    }

    const err = new Error(message);
    // @ts-ignore
    err.code = code;

    this.state = FINAL;
    this.onError(err);
  }

  private buffer(arg: any) {
    if (typeof arg === 'number') {
      return alloc(arg);
    }

    return from(arg);
  }
}
