import { CURSOR_MODE } from './kernel/events.js';
import { NPC_ROLE } from './npcs.js';

/**
 * Pick the Diablo-style cursor for what is under the mouse.
 * Priority matches click handling: portal → NPC → loot → monster → move.
 *
 * @param {object} hits
 * @param {object | null} [hits.portal]
 * @param {object | null} [hits.npc]
 * @param {object | null} [hits.lootDrop]
 * @param {object | null} [hits.monster]
 * @returns {string}
 */
export function resolveCursorMode({ portal = null, npc = null, lootDrop = null, monster = null }) {
  if (portal) return CURSOR_MODE.PORTAL;
  if (npc) {
    return npc.role === NPC_ROLE.VENDOR ? CURSOR_MODE.VENDOR : CURSOR_MODE.TALK;
  }
  if (lootDrop) return CURSOR_MODE.LOOT;
  if (monster) return CURSOR_MODE.ATTACK;
  return CURSOR_MODE.MOVE;
}
