import { filterJpeg } from './../src/image';
import { loadAssetsPattern } from './tools';
import exifr from 'exifr';

describe('jpegFilter', () => {
  let hasIccTest = false;
  let hasCommetTest = false;

  const assets = loadAssetsPattern('exif/*.jpg');

  assets.forEach((asset) => {
    it(`should strip exif data from ${asset.name}`, async () => {
      const filtered = filterJpeg(asset.file, { removeExif: true });
      const output = await exifr.parse(filtered);

      return expect(output).toEqual(undefined);
    });

    it(`should strip exif data and keep orientation from ${asset.name}`, async () => {
      const originalOrientation = await exifr.orientation(asset.file);

      const filtered = filterJpeg(asset.file, { removeExif: true, keepOrientation: true });
      const output = await exifr.orientation(filtered);
      return expect(output).toEqual(originalOrientation);
    });

    it(`should remove ICC profile from image ${asset.name}`, async () => {
      const hasIcc = await exifr.parse(asset.file, {
        tiff: false,
        icc: true,
      });

      if (!hasIccTest && !!hasIcc) {
        hasIccTest = true;
      }

      const filtered = filterJpeg(asset.file, { removeICCandAPP: true });
      const output = await exifr.parse(filtered, {
        tiff: false,
        icc: true,
      });

      return expect(output).toEqual(undefined);
    });

    it.skip(`should remove comments image ${asset.name}`, async () => {
      const hasComments = await exifr.parse(asset.file, {
        tiff: false,
        userComment: true,
      });

      if (!hasCommetTest && !!hasComments) {
        hasCommetTest = true;
      }

      // const filtered = filterJpeg(asset.file, { removeComments: true, filter: false });
      // const output = await exifr.parse(filtered, {
      //   tiff: false,
      //   userComment: true,
      // });
      // return expect(output).toEqual(undefined);
    });
  });

  it('should run at least one of ICC and comment removal tests', () => {
    expect(hasIccTest).toEqual(true);
    // expect(hasCommetTest).toEqual(true);
  });
});
