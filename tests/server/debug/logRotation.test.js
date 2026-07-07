import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  getLogFileSize,
  getLogRotationConfig,
  parseMaxBytes,
  parseMaxFiles,
  rotateLogFiles,
  rotatedLogPath,
} from '../../../server/debug/logRotation.js';

describe('logRotation', () => {
  /** @type {string} */
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mmo-debug-log-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('parseMaxBytes and parseMaxFiles fall back to defaults', () => {
    assert.equal(parseMaxBytes(undefined), 5 * 1024 * 1024);
    assert.equal(parseMaxFiles(undefined), 5);
    assert.equal(parseMaxBytes('invalid'), 5 * 1024 * 1024);
    assert.equal(parseMaxFiles('-1'), 5);
  });

  it('getLogRotationConfig reads env values', () => {
    const config = getLogRotationConfig('4096', '3');
    assert.equal(config.maxBytes, 4096);
    assert.equal(config.maxFiles, 3);
  });

  it('rotateLogFiles shifts numbered archives and drops the oldest', () => {
    const logPath = path.join(tempDir, 'debug-events.log');
    fs.writeFileSync(logPath, 'current');
    fs.writeFileSync(rotatedLogPath(logPath, 1), 'one');
    fs.writeFileSync(rotatedLogPath(logPath, 2), 'two');

    rotateLogFiles(logPath, 2);

    assert.equal(fs.readFileSync(rotatedLogPath(logPath, 1), 'utf8'), 'current');
    assert.equal(fs.readFileSync(rotatedLogPath(logPath, 2), 'utf8'), 'one');
    assert.equal(fs.existsSync(logPath), false);
    assert.equal(fs.existsSync(rotatedLogPath(logPath, 3)), false);
  });

  it('getLogFileSize returns 0 for missing files', () => {
    const logPath = path.join(tempDir, 'missing.log');
    assert.equal(getLogFileSize(logPath), 0);
  });
});
