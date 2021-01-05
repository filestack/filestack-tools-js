import { JpegFilter } from './helpers/jpegFilter';
import { getOrientation, generateExifOrientation, overwriteInFile } from './helpers/exifOrientation';
export const image = {};

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
 * @param file
 * @param options
 */
export const filterJpeg = (file: Buffer, options: FilterJpegOptions) => {
  let orientation;

  if (options.keepOrientation) {
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
