import { itemToJSON } from '../../shared/items.js';

let nextLootId = 1;

export function resetLootIdCounter(start = 1) {
  nextLootId = start;
}

export class LootManager {
  constructor() {
    this.drops = new Map();
  }

  spawn(x, y, item) {
    const drop = {
      id: `loot${nextLootId++}`,
      item,
      x,
      y,
    };
    this.drops.set(drop.id, drop);
    return drop;
  }

  get(id) {
    return this.drops.get(id);
  }

  remove(id) {
    this.drops.delete(id);
  }

  getAll() {
    return [...this.drops.values()].map((drop) => ({
      id: drop.id,
      x: drop.x,
      y: drop.y,
      item: itemToJSON(drop.item),
    }));
  }
}
