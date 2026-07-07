import { CURSOR_MODE } from '/shared/events.js';

/** Hotspot is the click point (x, y from top-left of the 32×32 asset). */
export const GAME_CURSOR_ASSETS = {
  [CURSOR_MODE.MOVE]: { url: '/assets/cursors/move.svg', x: 4, y: 3 },
  [CURSOR_MODE.ATTACK]: { url: '/assets/cursors/attack.svg', x: 22, y: 22 },
  [CURSOR_MODE.LOOT]: { url: '/assets/cursors/loot.svg', x: 16, y: 18 },
  [CURSOR_MODE.PORTAL]: { url: '/assets/cursors/portal.svg', x: 16, y: 16 },
  [CURSOR_MODE.TALK]: { url: '/assets/cursors/talk.svg', x: 10, y: 24 },
  [CURSOR_MODE.VENDOR]: { url: '/assets/cursors/vendor.svg', x: 16, y: 20 },
};

const FALLBACK = 'pointer';

/**
 * @param {string} mode — CURSOR_MODE value
 * @returns {string} CSS cursor value
 */
export function formatGameCursor(mode) {
  const asset = GAME_CURSOR_ASSETS[mode] ?? GAME_CURSOR_ASSETS[CURSOR_MODE.MOVE];
  return `url('${asset.url}') ${asset.x} ${asset.y}, ${FALLBACK}`;
}
