import { itemToJSON } from '../../shared/items.js';
import { canPickupLoot, serializeLootForClient } from '../../shared/lootRules.js';

let nextLootId = 1;

export function resetLootIdCounter(start = 1) {
  nextLootId = start;
}

export class LootManager {
  constructor() {
    this.drops = new Map();
  }

  spawn(x, y, item, meta = {}) {
    const drop = {
      id: `loot${nextLootId++}`,
      item,
      x,
      y,
      killerId: meta.killerId ?? null,
      eligiblePlayerIds: meta.eligiblePlayerIds ?? [],
      freeForAllAt: meta.freeForAllAt ?? 0,
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

  getAllForViewer(viewerId, now = Date.now()) {
    return [...this.drops.values()].map((drop) =>
      serializeLootForClient(
        {
          id: drop.id,
          x: drop.x,
          y: drop.y,
          item: itemToJSON(drop.item),
          eligiblePlayerIds: drop.eligiblePlayerIds,
          freeForAllAt: drop.freeForAllAt,
        },
        viewerId,
        now
      )
    );
  }

  /** @deprecated use getAllForViewer */
  getAll() {
    return [...this.drops.values()].map((drop) => ({
      id: drop.id,
      x: drop.x,
      y: drop.y,
      item: itemToJSON(drop.item),
      pickupLocked: false,
    }));
  }
}

export function canPlayerPickupDrop(drop, playerId, now = Date.now()) {
  return canPickupLoot(drop, playerId, now);
}
