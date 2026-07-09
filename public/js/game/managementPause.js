/**
 * Pause gameplay while managing stats/skills/inventory — only when alone on the server.
 * @param {number | null | undefined} onlineCount
 * @param {number} [fallbackRemoteCount]
 */
export function isAloneOnServer(onlineCount, fallbackRemoteCount = 0) {
  if (typeof onlineCount === 'number') return onlineCount <= 1;
  return fallbackRemoteCount === 0;
}

/**
 * @param {object} state
 * @param {boolean} [state.inventoryVisible]
 * @param {boolean} [state.stashVisible]
 * @param {boolean} [state.levelUpVisible]
 * @param {boolean} [state.skillTreeVisible]
 */
export function wantsManagementPause(state) {
  return !!(
    state.inventoryVisible ||
    state.stashVisible ||
    state.levelUpVisible ||
    state.skillTreeVisible
  );
}

/**
 * @param {object} options
 * @param {boolean} options.wantsPause
 * @param {boolean} options.alone
 */
export function shouldPauseGameplay({ wantsPause, alone }) {
  return wantsPause && alone;
}
