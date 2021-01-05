import { extensionToMime, getMimetype, isAcceptable } from './../src/mimetype';
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
      {
        path: 'common/sample.txt',
        expectedMime: 'text/plain',
      },
      {
        path: 'common/noext',
        expectedMime: 'text/plain',
      },
      {
        path: 'common/sample.undefined',
        expectedMime: 'image/gif',
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

  describe('isAccetable', () => {
    it('should accept mimetypes from list', () => {
      const acceptList = ['image/jpeg', 'image/png', 'text/html'];

      expect(isAcceptable('image/jpeg', acceptList)).toBeTruthy();
      expect(isAcceptable('image/jpg', acceptList)).toBeTruthy();
      expect(isAcceptable('image/png', acceptList)).toBeTruthy();
      expect(isAcceptable('text/html', acceptList)).toBeTruthy();
    });

    it('should accept mimetypes from list with wildcard', () => {
      const acceptList = ['image/*', 'video/*', 'audio/*', 'application/*', 'text/*'];

      expect(isAcceptable('image/jpeg', acceptList)).toBeTruthy();
      expect(isAcceptable('image/png', acceptList)).toBeTruthy();

      expect(isAcceptable('video/mpeg', acceptList)).toBeTruthy();

      expect(isAcceptable('audio/mp3', acceptList)).toBeTruthy();

      expect(isAcceptable('application/pdf', acceptList)).toBeTruthy();

      expect(isAcceptable('text/plain', acceptList)).toBeTruthy();
    });

    it('should respect string accept argument', () => {
      expect(isAcceptable('image/jpeg', 'image/jpeg')).toBeTruthy();
    });

    it('should extract mimetype from file extension', () => {
      expect(isAcceptable('test_image.jpg', 'image/jpeg')).toBeTruthy();
    });

    it('should return true if extension is not recognized', () => {
      expect(isAcceptable('test_image', 'image/jpeg')).toBeTruthy();
    });

    it('should return false if extension is not recognized and flag is set to false', () => {
      expect(isAcceptable('test_image', 'image/jpeg', false)).toBeFalsy();
    });
  });
});
