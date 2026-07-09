import { CURSOR_MODE } from '/shared/events.js';
import { findMonsterAt } from '/shared/combat.js';
import { findLootAt } from '/shared/inventory.js';
import { findChestAt } from '/shared/dungeonChests.js';
import { findPortalAt } from '/shared/portals.js';
import { findNpcAt } from '/shared/npcs.js';
import { resolveCursorMode } from '/shared/cursorModes.js';
import { formatGameCursor } from './gameCursors.js';

const MODE_CLASSES = [
  'cursor-move',
  'cursor-attack',
  'cursor-loot',
  'cursor-portal',
  'cursor-talk',
  'cursor-vendor',
];

export class CursorManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.mode = CURSOR_MODE.DEFAULT;
    this.active = false;
  }

  /** Enable custom cursors while in-game. */
  setActive(active) {
    this.active = !!active;
    if (!this.active) {
      this.mode = CURSOR_MODE.DEFAULT;
      this.canvas.classList.remove('game-active', ...MODE_CLASSES);
      this.canvas.style.cursor = '';
      return;
    }
    this.canvas.classList.add('game-active');
    this.applyMode(this.mode === CURSOR_MODE.DEFAULT ? CURSOR_MODE.MOVE : this.mode);
  }

  update(worldPos, monsters = [], loot = [], portals = [], npcs = [], map = null, openedChests = []) {
    if (!this.active) return;

    const chest =
      map && findChestAt(map, worldPos.x, worldPos.y, openedChests);

    const nextMode = resolveCursorMode({
      portal: findPortalAt(portals, worldPos.x, worldPos.y),
      npc: findNpcAt(npcs, worldPos.x, worldPos.y),
      lootDrop: findLootAt(loot, worldPos.x, worldPos.y),
      chest,
      monster: findMonsterAt(monsters, worldPos.x, worldPos.y),
    });

    if (nextMode === this.mode) return;
    this.applyMode(nextMode);
  }

  /** @param {string} mode */
  applyMode(mode) {
    this.mode = mode;
    this.canvas.classList.remove(...MODE_CLASSES);
    this.canvas.classList.add(`cursor-${mode}`);
    this.canvas.style.cursor = formatGameCursor(mode);
  }
}
