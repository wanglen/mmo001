import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Application semver from package.json. */
export const APP_VERSION = JSON.parse(
  readFileSync(path.join(rootDir, 'package.json'), 'utf8')
).version;

export function getAppVersion() {
  return APP_VERSION;
}
