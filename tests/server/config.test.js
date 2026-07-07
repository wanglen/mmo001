import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  envFlag,
  parsePort,
  shouldWarnMissingSessionSecret,
} from '../../server/config.js';

describe('server config', () => {
  it('envFlag parses truthy strings', () => {
    assert.equal(envFlag('1'), true);
    assert.equal(envFlag('true'), true);
    assert.equal(envFlag('TRUE'), true);
    assert.equal(envFlag('0'), false);
    assert.equal(envFlag(undefined, true), true);
  });

  it('parsePort bounds valid ports', () => {
    assert.equal(parsePort('8080'), 8080);
    assert.equal(parsePort('bad', 3000), 3000);
    assert.equal(parsePort(70000, 3000), 3000);
  });

  it('shouldWarnMissingSessionSecret only in production', () => {
    assert.equal(shouldWarnMissingSessionSecret('development', undefined), false);
    assert.equal(shouldWarnMissingSessionSecret('production', undefined), true);
    assert.equal(shouldWarnMissingSessionSecret('production', 'short'), true);
    assert.equal(shouldWarnMissingSessionSecret('production', 'a'.repeat(16)), false);
  });
});
