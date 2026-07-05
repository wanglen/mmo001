import { CURSOR_MODE } from '/shared/events.js';
import { findMonsterAt } from '/shared/combat.js';
import { findLootAt } from '/shared/inventory.js';
import { findPortalAt } from '/shared/portals.js';

export class CursorManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.mode = CURSOR_MODE.DEFAULT;
  }

  update(worldPos, monsters = [], loot = [], portals = []) {
    const portal = findPortalAt(portals, worldPos.x, worldPos.y);
    const lootDrop = findLootAt(loot, worldPos.x, worldPos.y);
    const monster = findMonsterAt(monsters, worldPos.x, worldPos.y);

    let nextMode = CURSOR_MODE.MOVE;
    if (portal) nextMode = CURSOR_MODE.PORTAL;
    else if (lootDrop) nextMode = CURSOR_MODE.LOOT;
    else if (monster) nextMode = CURSOR_MODE.ATTACK;

    if (nextMode === this.mode) return;
    this.mode = nextMode;
    this.canvas.classList.remove('cursor-move', 'cursor-attack', 'cursor-loot', 'cursor-portal');
    if (nextMode === CURSOR_MODE.PORTAL) this.canvas.classList.add('cursor-portal');
    else if (nextMode === CURSOR_MODE.LOOT) this.canvas.classList.add('cursor-loot');
    else if (nextMode === CURSOR_MODE.ATTACK) this.canvas.classList.add('cursor-attack');
    else this.canvas.classList.add('cursor-move');
  }
}
