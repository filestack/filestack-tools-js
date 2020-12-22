import { readFileSync } from 'fs';
import * as glob from 'glob';
import * as Path from 'path';

const assetPath = Path.resolve(process.cwd(), 'tests/assets');

export const loadAssetsPattern = (pattern: string) => {
  const files = glob.sync(pattern, {
    cwd: assetPath,
  });

  return files.map(loadAsset);
};

export const loadAsset = (name: string) => {
  return {
    file: readFileSync(Path.join(assetPath, name)),
    name: Path.basename(Path.join(assetPath, name)),
  };
};
