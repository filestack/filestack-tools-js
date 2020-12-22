/* eslint no-bitwise: ["error", { "allow": ["&"] }] */

const toHexString = (byteArray) => {
  let s = '0x';
  byteArray.forEach((byte) => {
    s += (`0${(byte & 0xFF).toString(16)}`).slice(-2);
  });
  return s;
};

const findExifPosition = (fileBuffer) => {
  const dataView = new DataView(fileBuffer);
  const length = fileBuffer.byteLength;
  const position = {};
  let marker;
  let offset = 2;
  let start;
  let end;

  if ((dataView.getUint8(0) !== 0xFF) || (dataView.getUint8(1) !== 0xD8)) {
    // Not a valid jpeg
    return;
  }

  while (offset < length) {
    if (dataView.getUint8(offset) !== 0xFF) {
      // console.log("Not a valid marker at offset " + offset + ", found: " + dataView.getUint8(offset));
      // Not a valid marker, something is wrong in the image structure. Better to terminate.
      return;
    }

    marker = dataView.getUint8(offset + 1);
    start = offset;
    end = offset + 2 + dataView.getUint16(offset + 2);

    if (marker >= 0xE1 && marker <= 0xEF) {
      // APPn marker found!
      if (position.startOffset === undefined) {
        position.startOffset = start;
      }
      position.endOffset = end;
    } else if (position.startOffset !== undefined) {
      // We already collected some data, and now stumbled upon non-exif marker,
      // what means we have everything what we wanted.
      return position; // eslint-disable-line consistent-return
    } else if (marker === 0xDA) {
      // We didn't find any data and after this marker all metadata has been read.
      // No point in searching further.
      return;
    }

    offset = end;
  }
};

const findWhereExifCanBePut = (fileBuffer) => {
  const dataView = new DataView(fileBuffer);
  const sof0Marker = 0xC0;
  const sof2Marker = 0xC2;
  const app0Marker = 0xE0;
  const length = fileBuffer.byteLength;
  let offset = 2;
  let marker;
  let end;
  let position;

  while (offset < length) {
    marker = dataView.getUint8(offset + 1);
    end = offset + 2 + dataView.getUint16(offset + 2);

    if (marker === sof0Marker || marker === sof2Marker || marker === app0Marker) {
      position = {
        startOffset: end,
        endOffset: end,
      };

      break;
    }

    offset = end;
  }

  return position;
};

const extractFrom = (fileBuffer) => {
  const position = findExifPosition(fileBuffer);

  if (!position) {
    // This image has no exif data
    return new ArrayBuffer(0);
  }
  return fileBuffer.slice(position.startOffset, position.endOffset);
};

const overwriteInFile = (targetFile, exifChunk) => {
  let targetExifPosition = findExifPosition(targetFile);
  if (!targetExifPosition) {
    targetExifPosition = findWhereExifCanBePut(targetFile);
  }
  if (!targetExifPosition) {
    // Couldn't find position in file where the APP data safely can be put.
    // Aborting without introducing any changes to file.
    return targetFile;
  }

  const header = targetFile.slice(0, targetExifPosition.startOffset);
  const rest = targetFile.slice(targetExifPosition.endOffset);

  const resultFile = new Uint8Array(header.byteLength + exifChunk.byteLength + rest.byteLength);
  resultFile.set(new Uint8Array(header), 0);
  resultFile.set(new Uint8Array(exifChunk), header.byteLength);
  resultFile.set(new Uint8Array(rest), header.byteLength + exifChunk.byteLength);

  return resultFile.buffer;
};

// add orientation to file exif data
const generateExifOrientation = (orientation = 1) => {
  const standartExifString = 'ffe100004578696600004d4d002a0000000800010112000300000001000000000000';
  const exifBuffer = new Uint8Array(standartExifString.length / 2);

  for (let i = 0; i < standartExifString.length; i += 2) {
    exifBuffer[i / 2] = parseInt(standartExifString.substring(i, i + 2), 16);
  }

  const dw = new DataView(exifBuffer.buffer);
  dw.setUint16(dw.byteLength - 6, orientation);
  dw.setUint16(2, dw.byteLength - 2); // -2 exif preambule bytes

  return dw.buffer;
};

const findExifStartPosition = (file) => {
  const view = new DataView(file);
  const length = view.byteLength;
  let offset = 2;

  while (offset < length) {
    if (view.getUint16(offset + 2, false) <= 8) {
      return false;
    }

    const marker = view.getUint16(offset, false);
    offset += 2;

    if (marker === 0xffe1) {
      offset += 2;
      if (view.getUint32(offset, false) !== 0x45786966) {
        return false;
      }

      const little = view.getUint16((offset += 6), false) === 0x4949;
      offset += view.getUint32(offset + 4, little);

      const tags = view.getUint16(offset, little);

      offset += 2;

      // eslint-disable-next-line
      for (let i = 0; i < tags; i++) {
        if (view.getUint16(offset + (i * 12), little) === 0x0112) {
          return {
            offset: offset + (i * 12) + 8,
            endian: little,
          };
        }
      }
      // tslint:disable-next-line:no-bitwise
    } else if ((marker & 0xff00) !== 0xff00) {
      break;
    } else {
      offset += view.getUint16(offset, false);
    }
  }

  return false;
};

const getOrientation = (file) => {
  const view = new DataView(file);
  const exifPosition = findExifStartPosition(file);

  if (!exifPosition) {
    return false;
  }

  return view.getUint16(exifPosition.offset, exifPosition.endian);
};

// method replace exif orientation with current one
const setOrientation = (file, orientation) => {
  const exifPosition = findExifStartPosition(file);

  if (!exifPosition) {
    return file;
  }

  const view = new DataView(file);
  view.setUint16(exifPosition.offset, orientation, exifPosition.endian);

  return view.buffer;
};

export default {
  toHexString,
  extractFrom,
  overwriteInFile,
  setOrientation,
  getOrientation,
  generateExifOrientation,
};
