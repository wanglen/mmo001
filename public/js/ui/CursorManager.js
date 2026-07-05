import { CURSOR_MODE } from '/shared/events.js';
import { findMonsterAt } from '/shared/combat.js';
import { findLootAt } from '/shared/inventory.js';

export class CursorManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.mode = CURSOR_MODE.DEFAULT;
  }

  update(worldPos, monsters = [], loot = []) {
    const lootDrop = findLootAt(loot, worldPos.x, worldPos.y);
    const monster = findMonsterAt(monsters, worldPos.x, worldPos.y);

    let nextMode = CURSOR_MODE.MOVE;
    if (lootDrop) nextMode = CURSOR_MODE.LOOT;
    else if (monster) nextMode = CURSOR_MODE.ATTACK;

    if (nextMode === this.mode) return;
    this.mode = nextMode;
    this.canvas.classList.remove('cursor-move', 'cursor-attack', 'cursor-loot');
    if (nextMode === CURSOR_MODE.LOOT) this.canvas.classList.add('cursor-loot');
    else if (nextMode === CURSOR_MODE.ATTACK) this.canvas.classList.add('cursor-attack');
    else this.canvas.classList.add('cursor-move');
  }
}
