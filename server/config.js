/**
 * Centralized environment configuration for the game server.
 */

/**
 * @param {string | undefined} value
 * @param {boolean} [fallback=false]
 */
export function envFlag(value, fallback = false) {
  if (value == null || value === '') return fallback;
  return value === '1' || value.toLowerCase() === 'true';
}

/**
 * @param {string | number | undefined} value
 * @param {number} [fallback=3000]
 */
export function parsePort(value, fallback = 3000) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0 || n > 65535) return fallback;
  return Math.floor(n);
}

/**
 * @param {string | undefined} nodeEnv
 * @param {string | undefined} sessionSecret
 */
export function shouldWarnMissingSessionSecret(nodeEnv, sessionSecret) {
  if (nodeEnv !== 'production') return false;
  return typeof sessionSecret !== 'string' || sessionSecret.length < 16;
}

export const NODE_ENV = process.env.NODE_ENV ?? 'development';
export const PORT = parsePort(process.env.PORT);
export const SESSION_SECRET = process.env.SESSION_SECRET;
export const LEGACY_ACCOUNT_USERNAME = process.env.LEGACY_ACCOUNT_USERNAME ?? 'legacy';
export const LEGACY_ACCOUNT_PASSWORD = process.env.LEGACY_ACCOUNT_PASSWORD ?? 'legacy';
export const DEBUG_EVENTS = envFlag(process.env.DEBUG_EVENTS);
export const DEBUG_LOG_FILE = process.env.DEBUG_LOG_FILE;
export const DEBUG_LOG_MAX_BYTES = process.env.DEBUG_LOG_MAX_BYTES;
export const DEBUG_LOG_MAX_FILES = process.env.DEBUG_LOG_MAX_FILES;

/** Local Ollama for per-player quest generation. */
export const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://127.0.0.1:11434';
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'mmo001-quests';
export const OLLAMA_ENABLED = envFlag(process.env.OLLAMA_ENABLED, true);
export const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS) || 180_000;
export const QUEST_GEN_COOLDOWN_MS = Number(process.env.QUEST_GEN_COOLDOWN_MS) || 15_000;
export const QUEST_GEN_MAX_ACTIVE = Number(process.env.QUEST_GEN_MAX_ACTIVE) || 3;
export const QUEST_GEN_LOG = envFlag(process.env.QUEST_GEN_LOG, true);
export const QUEST_GEN_LOG_FILE = process.env.QUEST_GEN_LOG_FILE;

/** Log production misconfiguration warnings once at startup. */
export function warnProductionConfig() {
  if (shouldWarnMissingSessionSecret(NODE_ENV, SESSION_SECRET)) {
    console.warn(
      '[config] SESSION_SECRET is not set — sessions invalidate on each restart. Set a stable secret in production.'
    );
  }
}
