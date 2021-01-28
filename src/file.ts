/* tslint:disable no-var-requires */
const fileType = require('file-type');
const isUtf8 = require('isutf8');
/* tslint:enable no-var-requires */

import { ExtensionsMap } from './assets/extensions';
import { JpegFilter } from './helpers/jpegFilter';
import { getOrientation, generateExifOrientation, overwriteInFile } from './helpers/exifOrientation';

/**
 * Filter Options
 */
export interface FilterJpegOptions {
  removeICCandAPP?: boolean; // remove some application data like photoshop etc
  removeImage?: boolean; // remove image data
  comment?: string | null; // add comment
  filter?: boolean; // enable filters
  removeExif?: boolean; // filter exif data
  keepOrientation?: boolean;
  // removeComments?: boolean; // filter comments @todo check it
}

/**
 * Filter JPEG/TIFF data
 *
 * @param file {Buffer|Unit8Array} - File buffer or Unit8Array with image
 * @param options {FilterJpegOptions} - filter options
 */
export const filterJpeg = (file: Buffer, options: FilterJpegOptions) => {
  let orientation;

  if (options.removeExif && options.keepOrientation) {
    orientation = getOrientation(file.buffer) || 1;
  }

  const filter = new JpegFilter(options);

  filter.push(file);
  filter.end();

  let output = Buffer.concat(filter.output);

  if (options.keepOrientation && orientation) {
    // @ts-ignore
    output = overwriteInFile(output.buffer, generateExifOrientation(orientation));
  }

  return output;
};

/**
 * Change extension to according mimetype using ext=>mimetype map
 *
 * @param ext {string} - extension to convert
 * @return string|boolean
 */
export const extensionToMime = (ext: string) => {
  if (!ext || ext.length === 0) {
    return;
  }

  if (ext.split('/').length === 2) {
    return ext;
  }

  if (ext.indexOf('.') > -1) {
    ext = ext.split('.').pop() as string;
  }

  const keys = Object.keys(ExtensionsMap);
  const mapLen = keys.length;

  for (let i = 0; i < mapLen; i++) {
    if (ExtensionsMap[keys[i]].indexOf(ext) > -1) {
      return keys[i];
    }
  }

  return;
};

/**
 * Get file mimetype
 *
 * @param {Uint8Array | Buffer} file
 * @returns {string} - mimetype
 */
export const getMimetype = (file: Uint8Array | Buffer, name?: string): string => {
  // @ts-ignore
  const type = fileType(file);
  const excludedMimetypes = ['text/plain', 'application/octet-stream', 'application/x-ms', 'application/x-msi', 'application/zip'];

  if (type && excludedMimetypes.indexOf(type.mime) === -1) {
    return type.mime;
  }

  if (name && name.indexOf('.') > -1) {
    const mime = extensionToMime(name);
    if (mime) {
      return mime;
    }
  }

  try {
    if (isUtf8(file)) {
      return 'text/plain';
    }
  } catch (e) {
    /* istanbul ignore next */
    // debug('Additional mimetype checks (text/plain) are currently not supported for browsers');
  }
  // this is only fallback, omit it in coverage
  /* istanbul ignore next */

  // if we cant find types by extensions and we have magic bytes fallback to it
  if (type) {
    return type.mime;
  }

  return 'application/octet-stream';
};

/**
 * Check if input string is in acceptable array of mimes
 *
 * @param input {string} mimetype, filename with extension or extension to check
 * @param accept {string | string[]} mimetype or array of mimetype to check against
 * @param trueIfNotFound {boolean} if mime is not found or accept array is empty what should we return
 */
export const isAcceptable = (input: string, accept: string | string[], trueIfNotFound: boolean = true): boolean => {
  if (!Array.isArray(accept)) {
    accept = [accept];
  }

  const isMimetype = (str: string) => str.indexOf('/') !== -1;
  const fileMime = isMimetype(input) ? input : extensionToMime(input);

  if (!fileMime || accept.length === 0) {
    return trueIfNotFound;
  }

  const canAccept = (mime: string, acceptMime: string) => {
    if (mime && acceptMime === 'image/*') {
      return mime.indexOf('image/') !== -1;
    }

    if (mime && acceptMime === 'video/*') {
      return mime.indexOf('video/') !== -1;
    }
    if (mime && acceptMime === 'audio/*') {
      return mime.indexOf('audio/') !== -1;
    }
    if (mime && acceptMime === 'application/*') {
      return mime.indexOf('application/') !== -1;
    }
    if (mime && acceptMime === 'text/*') {
      return mime.indexOf('text/') !== -1;
    }

    if (mime && ['image/jpg', 'image/jpeg'].indexOf(acceptMime) > -1) {
      return ['image/jpg', 'image/jpeg'].indexOf(mime) > -1;
    }

    return mime === acceptMime;
  };

  return accept.some((acc) => canAccept(fileMime, acc));
};
