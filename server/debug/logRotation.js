import fs from 'fs';

const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;
const DEFAULT_MAX_FILES = 5;

/**
 * @param {string | undefined} value
 * @param {number} fallback
 */
export function parseMaxBytes(value, fallback = DEFAULT_MAX_BYTES) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

/**
 * @param {string | undefined} value
 * @param {number} fallback
 */
export function parseMaxFiles(value, fallback = DEFAULT_MAX_FILES) {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) && n >= 1 ? n : fallback;
}

/**
 * @param {string} logPath
 * @param {number} [index] 0 = active log, 1+ = rotated copies
 */
export function rotatedLogPath(logPath, index = 0) {
  return index === 0 ? logPath : `${logPath}.${index}`;
}

/**
 * @param {string} logPath
 * @param {import('fs')} [fsModule]
 */
export function getLogFileSize(logPath, fsModule = fs) {
  try {
    return fsModule.statSync(logPath).size;
  } catch {
    return 0;
  }
}

/**
 * Shift `log`, `log.1`, … keeping at most `maxFiles` archived copies.
 * @param {string} logPath
 * @param {number} maxFiles
 * @param {import('fs')} [fsModule]
 */
export function rotateLogFiles(logPath, maxFiles, fsModule = fs) {
  const capped = Math.max(1, Math.floor(maxFiles));
  const oldest = rotatedLogPath(logPath, capped);
  if (fsModule.existsSync(oldest)) {
    fsModule.unlinkSync(oldest);
  }

  for (let index = capped - 1; index >= 1; index -= 1) {
    const src = rotatedLogPath(logPath, index);
    const dest = rotatedLogPath(logPath, index + 1);
    if (fsModule.existsSync(src)) {
      fsModule.renameSync(src, dest);
    }
  }

  if (fsModule.existsSync(logPath)) {
    fsModule.renameSync(logPath, rotatedLogPath(logPath, 1));
  }
}

/**
 * @param {string | undefined} maxBytesEnv
 * @param {string | undefined} maxFilesEnv
 */
export function getLogRotationConfig(maxBytesEnv, maxFilesEnv) {
  return {
    maxBytes: parseMaxBytes(maxBytesEnv),
    maxFiles: parseMaxFiles(maxFilesEnv),
  };
}
