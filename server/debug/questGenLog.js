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
  process.env.QUEST_GEN_LOG_FILE ?? path.join(rootDir, 'data', 'quest-generation.log');

let stream = null;
let activeBytes = 0;

function isEnabled() {
  // Dedicated log: on by default (generation is rare). Set QUEST_GEN_LOG=0 to disable.
  const value = process.env.QUEST_GEN_LOG;
  if (value == null || value === '') return true;
  return value === '1' || value.toLowerCase() === 'true';
}

function rotationConfig() {
  return getLogRotationConfig(
    process.env.QUEST_GEN_LOG_MAX_BYTES ?? process.env.DEBUG_LOG_MAX_BYTES,
    process.env.QUEST_GEN_LOG_MAX_FILES ?? process.env.DEBUG_LOG_MAX_FILES
  );
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
 * Append one JSON line for a quest-generation attempt.
 * @param {object} data
 */
export function logQuestGeneration(data = {}) {
  if (!isEnabled()) return;

  const line = JSON.stringify({
    at: new Date().toISOString(),
    type: 'quest_generate',
    ...data,
  });
  writeLine(line);
}

export function isQuestGenLogEnabled() {
  return isEnabled();
}

export function getQuestGenLogPath() {
  return LOG_PATH;
}

/** @param {import('fs').WriteStream | null} next */
export function _setQuestGenStreamForTests(next) {
  closeStream();
  stream = next;
  activeBytes = 0;
}
