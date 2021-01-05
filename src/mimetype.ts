import fileType from 'file-type';
import isUtf8 from 'isutf8';
import { ExtensionsMap } from './assets/extensions';

/**
 * Change extension to according mimetype using ext=>mimetype map
 *
 * @param ext - string
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
 * @param input - mimetype, filename with extension or extension to check
 * @param accept - mimetype or array of mimetype to check against
 * @param trueIfNotFound - if mime is not found or accept array is empty what should we return
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

  return accept.some((accept) => canAccept(fileMime, accept));
};
