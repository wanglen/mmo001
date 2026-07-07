import crypto from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(crypto.scrypt);

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
export const PASSWORD_MIN = 6;
export const PASSWORD_MAX = 72;
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const MAX_CHARACTERS_PER_ACCOUNT = 8;

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

/**
 * @param {string} username
 * @returns {{ ok: true, username: string } | { ok: false, reason: string }}
 */
export function validateUsername(username) {
  const value = typeof username === 'string' ? username.trim() : '';
  if (value.length < USERNAME_MIN || value.length > USERNAME_MAX) {
    return { ok: false, reason: 'invalid_username' };
  }
  if (!USERNAME_PATTERN.test(value)) {
    return { ok: false, reason: 'invalid_username' };
  }
  return { ok: true, username: value };
}

/**
 * @param {string} password
 * @returns {{ ok: true } | { ok: false, reason: string }}
 */
export function validatePassword(password) {
  if (typeof password !== 'string') return { ok: false, reason: 'invalid_password' };
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    return { ok: false, reason: 'invalid_password' };
  }
  return { ok: true };
}

/**
 * @param {string} password
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await scryptAsync(password, salt, 64);
  return `${salt}:${derived.toString('hex')}`;
}

/**
 * @param {string} password
 * @param {string} stored
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, stored) {
  if (typeof stored !== 'string' || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const derived = await scryptAsync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  if (expected.length !== derived.length) return false;
  return crypto.timingSafeEqual(expected, derived);
}

/**
 * @param {string} [secret]
 * @returns {string}
 */
export function resolveSessionSecret(secret = process.env.SESSION_SECRET) {
  if (typeof secret === 'string' && secret.length >= 16) return secret;
  return crypto.randomBytes(32).toString('hex');
}

/**
 * @param {string} accountId
 * @param {string} secret
 * @param {number} [now]
 * @returns {string}
 */
export function createSessionToken(accountId, secret, now = Date.now()) {
  const expiresAt = now + SESSION_TTL_MS;
  const payload = `${accountId}:${expiresAt}`;
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${Buffer.from(payload).toString('base64url')}.${signature}`;
}

/**
 * @param {string} token
 * @param {string} secret
 * @param {number} [now]
 * @returns {string | null} accountId
 */
export function verifySessionToken(token, secret, now = Date.now()) {
  if (typeof token !== 'string' || !token.includes('.')) return null;

  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;

  let payload;
  try {
    payload = Buffer.from(encoded, 'base64url').toString('utf8');
  } catch {
    return null;
  }

  const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  const [accountId, expiresRaw] = payload.split(':');
  const expiresAt = Number(expiresRaw);
  if (!accountId || !Number.isFinite(expiresAt) || expiresAt <= now) return null;

  return accountId;
}
