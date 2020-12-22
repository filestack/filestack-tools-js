import { JpegFilter } from './helpers/jpegFilter';

export const image = {};

export interface filterJpegOptions {
  removeICCandAPP?: boolean; // remove some application data like photoshop etc
  removeImage?: boolean; // remove image data
  comment?: string | null; // add comment
  filter?: boolean; // enable filters
  removeExif?: boolean; // filter exif data
  removeComments?: boolean; // filter comments
}

export const filterJpeg = (file: Buffer, options: filterJpegOptions) => {
  const filter = new JpegFilter(options);

  filter.push(file);
  filter.end();

  return Buffer.concat(filter.output);
};
