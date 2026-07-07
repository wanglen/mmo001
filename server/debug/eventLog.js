import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getLogFileSize,
  getLogRotationConfig,
  rotateLogFiles,
} from './logRotation.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..', '..');

const LOG_PATH =
  process.env.DEBUG_LOG_FILE ?? path.join(rootDir, 'data', 'debug-events.log');

let stream = null;
let activeBytes = 0;

/** @type {Map<string, { lastAt: number, suppressed: number }>} */
const throttleState = new Map();

function isEnabled() {
  return process.env.DEBUG_EVENTS === '1' || process.env.DEBUG_EVENTS === 'true';
}

function rotationConfig() {
  return getLogRotationConfig(process.env.DEBUG_LOG_MAX_BYTES, process.env.DEBUG_LOG_MAX_FILES);
}

function closeStream() {
  if (!stream) return;
  stream.end();
  stream = null;
}

function rotateActiveLog() {
  closeStream();
  const { maxFiles } = rotationConfig();
  rotateLogFiles(LOG_PATH, maxFiles);
  activeBytes = 0;
}

function openStream() {
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  activeBytes = getLogFileSize(LOG_PATH);
  const { maxBytes } = rotationConfig();
  if (activeBytes >= maxBytes) {
    rotateActiveLog();
  }
  stream = fs.createWriteStream(LOG_PATH, { flags: 'a' });
}

function ensureStream() {
  if (stream) return stream;
  openStream();
  return stream;
}

/**
 * @param {string} line
 */
function writeLine(line) {
  const payload = `${line}\n`;
  const byteLength = Buffer.byteLength(payload, 'utf8');
  const { maxBytes } = rotationConfig();

  if (activeBytes > 0 && activeBytes + byteLength > maxBytes) {
    rotateActiveLog();
    openStream();
  }

  ensureStream().write(payload);
  activeBytes += byteLength;

  if (activeBytes >= maxBytes) {
    rotateActiveLog();
  }
}

/**
 * @param {string} type
 * @param {object} data
 * @param {{ source?: string, throttleMs?: number, throttleKey?: string }} [options]
 */
export function logGameEvent(type, data = {}, { source = 'server', throttleMs = 0, throttleKey = null } = {}) {
  if (!isEnabled()) return;

  const key = throttleKey ?? (throttleMs > 0 ? `${source}:${type}` : null);
  let payload = { ...data };

  if (throttleMs > 0 && key) {
    const now = Date.now();
    const prev = throttleState.get(key);
    if (prev && now - prev.lastAt < throttleMs) {
      prev.suppressed += 1;
      return;
    }
    if (prev?.suppressed > 0) {
      payload = { ...payload, suppressed: prev.suppressed };
    }
    throttleState.set(key, { lastAt: now, suppressed: 0 });
  }

  const line = JSON.stringify({
    at: new Date().toISOString(),
    source,
    type,
    ...payload,
  });

  writeLine(line);
}

export function isDebugEventsEnabled() {
  return isEnabled();
}

export function getDebugLogPath() {
  return LOG_PATH;
}

export function getDebugLogRotationConfig() {
  return rotationConfig();
}

/** @param {import('fs').WriteStream | null} next */
export function _setDebugStreamForTests(next) {
  closeStream();
  stream = next;
  activeBytes = 0;
  throttleState.clear();
}

/** @param {Map<string, { lastAt: number, suppressed: number }> | null} next */
export function _setThrottleStateForTests(next) {
  throttleState.clear();
  if (next) {
    for (const [key, value] of next) throttleState.set(key, value);
  }
}
