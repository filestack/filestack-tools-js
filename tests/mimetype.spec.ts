import { extensionToMime, getMimetype } from './../src/mimetype';
import { loadAsset } from './tools';

describe('mimetype', () => {
  describe('getMimetype', () => {
    const samples = [
      {
        path: 'common/sample.gif',
        expectedMime: 'image/gif',
      },
      {
        path: 'common/sample.jpg',
        expectedMime: 'image/jpeg',
      },
      {
        path: 'common/sample.odp',
        expectedMime: 'application/vnd.oasis.opendocument.presentation',
      },
      {
        path: 'common/sample.odt',
        expectedMime: 'application/vnd.oasis.opendocument.text',
      },
      {
        path: 'common/sample.pdf',
        expectedMime: 'application/pdf',
      },
      {
        path: 'common/sample.ppt',
        expectedMime: 'application/vnd.ms-powerpoint',
      },
      {
        path: 'common/sample.rtf',
        expectedMime: 'application/rtf',
      },
      {
        path: 'common/sample.svg',
        expectedMime: 'application/xml',
      },
    ];

    samples.forEach((sample) => {
      it(`should recognize file ${sample.path} as ${sample.expectedMime}`, () => {
        const asset = loadAsset(sample.path);
        expect(getMimetype(asset.file, asset.name)).toEqual(sample.expectedMime);
      });
    });
  });

  describe('extensionToMime', () => {
    const toTest = [
      {
        input: '',
        expected: undefined,
      },
      {
        input: 'image/png',
        expected: 'image/png',
      },
      {
        input: 'image/jpg',
        expected: 'image/jpg',
      },
      {
        input: 'application/pdf',
        expected: 'application/pdf',
      },
      {
        input: 'image/png',
        expected: 'image/png',
      },
      {
        input: '.png',
        expected: 'image/png',
      },
      {
        input: '.jpg',
        expected: 'image/jpeg',
      },
      {
        input: '.pdf',
        expected: 'application/pdf',
      },
      {
        input: '.key',
        expected: 'application/vnd.apple.keynote',
      },
      {
        input: '.zip',
        expected: 'application/zip',
      },
      {
        input: '.numbers',
        expected: 'application/vnd.apple.numbers',
      },
      {
        input: 'test.png',
        expected: 'image/png',
      },
    ];

    toTest.forEach((el) => {
      it(`should return ${el.expected} for ${el.input}`, () => {
        expect(extensionToMime(el.input)).toEqual(el.expected);
      });
    });
  });
});
