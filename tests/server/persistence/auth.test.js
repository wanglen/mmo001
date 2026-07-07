import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateUsername,
  validatePassword,
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  SESSION_TTL_MS,
} from '../../../server/persistence/auth.js';

describe('auth', () => {
  const secret = 'test-secret-key-32chars-min!!';

  it('validateUsername accepts alphanumeric names', () => {
    assert.equal(validateUsername('hero_1').ok, true);
    assert.equal(validateUsername('ab').ok, false);
    assert.equal(validateUsername('bad name').ok, false);
  });

  it('validatePassword enforces minimum length', () => {
    assert.equal(validatePassword('short').ok, false);
    assert.equal(validatePassword('longenough').ok, true);
  });

  it('hashPassword and verifyPassword round-trip', async () => {
    const hash = await hashPassword('secret123');
    assert.ok(await verifyPassword('secret123', hash));
    assert.equal(await verifyPassword('wrong', hash), false);
  });

  it('session tokens verify account id until expiry', () => {
    const now = 1_000_000;
    const token = createSessionToken('acc-1', secret, now);
    assert.equal(verifySessionToken(token, secret, now + 1000), 'acc-1');
    assert.equal(verifySessionToken(token, secret, now + SESSION_TTL_MS + 1), null);
    assert.equal(verifySessionToken('bad.token', secret, now + 1000), null);
  });
});
