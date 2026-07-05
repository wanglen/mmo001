import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { APP_VERSION, getAppVersion } from '../../server/version.js';

describe('version', () => {
  it('getAppVersion returns semver from package.json', () => {
    assert.equal(getAppVersion(), APP_VERSION);
    assert.match(APP_VERSION, /^\d+\.\d+\.\d+$/);
  });
});
