import { BASE_STATS } from './stats.js';
import { EQUIP_SLOTS } from './items.js';
import { getSocketStatBonuses } from './plugins/items/sockets.js';
import { getSetBonuses } from './plugins/items/sets.js';
import {
  isConsumable,
  canStackConsumables,
  getStackCount,
  MAX_CONSUMABLE_STACK,
} from './consumables.js';

export const INVENTORY_COLS = 10;
export const INVENTORY_ROWS = 4;
export const INVENTORY_SIZE = INVENTORY_COLS * INVENTORY_ROWS;
export const PICKUP_RANGE = 40;
export const LOOT_HIT_RADIUS = 14;

export function isInPickupRange(x1, y1, x2, y2, range = PICKUP_RANGE) {
  return Math.hypot(x2 - x1, y2 - y1) <= range;
}

export function createEmptyInventory() {
  return new Array(INVENTORY_SIZE).fill(null);
}

export function createEmptyEquipment() {
  return Object.fromEntries(EQUIP_SLOTS.map((slot) => [slot, null]));
}

export function addItemToInventory(inventory, item) {
  if (isConsumable(item)) {
    let incoming = { ...item, stackCount: getStackCount(item) };

    for (let i = 0; i < inventory.length; i++) {
      const existing = inventory[i];
      if (!canStackConsumables(existing, incoming)) continue;

      const space = MAX_CONSUMABLE_STACK - getStackCount(existing);
      if (space <= 0) continue;

      const transfer = Math.min(space, getStackCount(incoming));
      existing.stackCount = getStackCount(existing) + transfer;
      const remaining = getStackCount(incoming) - transfer;

      if (remaining <= 0) return { ok: true, index: i, stacked: true };

      incoming = { ...incoming, stackCount: remaining };
    }

    const index = inventory.findIndex((slot) => slot === null);
    if (index === -1) return { ok: false, reason: 'full' };
    inventory[index] = incoming;
    return { ok: true, index };
  }

  const index = inventory.findIndex((slot) => slot === null);
  if (index === -1) return { ok: false, reason: 'full' };
  inventory[index] = item;
  return { ok: true, index };
}

export function findLootAt(lootDrops, x, y, radius = LOOT_HIT_RADIUS) {
  let best = null;
  let bestDist = radius;

  for (const drop of lootDrops) {
    const d = Math.hypot(drop.x - x, drop.y - y);
    if (d <= bestDist) {
      best = drop;
      bestDist = d;
    }
  }

  return best;
}

export function getItemStatBonuses(item) {
  const bonuses = { str: 0, dex: 0, int: 0, vit: 0, hp: 0, mp: 0, damagePercent: 0 };
  if (!item) return bonuses;

  for (const [stat, value] of Object.entries(item.stats ?? {})) {
    if (bonuses[stat] !== undefined) bonuses[stat] += value;
  }

  for (const [stat, value] of Object.entries(getSocketStatBonuses(item.sockets))) {
    if (bonuses[stat] !== undefined) bonuses[stat] += value;
  }

  return bonuses;
}

export function getEquipmentBonuses(equipment) {
  const bonuses = { str: 0, dex: 0, int: 0, vit: 0, hp: 0, mp: 0, damagePercent: 0 };

  for (const item of Object.values(equipment)) {
    if (!item) continue;
    const itemBonuses = getItemStatBonuses(item);
    for (const [stat, value] of Object.entries(itemBonuses)) {
      if (bonuses[stat] !== undefined) bonuses[stat] += value;
    }
  }

  for (const [stat, value] of Object.entries(getSetBonuses(equipment))) {
    if (bonuses[stat] !== undefined) bonuses[stat] += value;
  }

  return bonuses;
}

/** Effective combat stats with equipment bonuses applied server-side. */
export function getEffectiveCombatStats(player, equipment) {
  const bonuses = getEquipmentBonuses(equipment);
  const base = BASE_STATS[player.characterClass] ?? BASE_STATS.warrior;

  const str = player.str + bonuses.str;
  const dex = player.dex + bonuses.dex;
  const int = player.int + bonuses.int;
  const vit = player.vit + bonuses.vit;
  const maxHp = base.hp + vit * 5 + bonuses.hp;
  const maxMp = base.mp + int * 3 + bonuses.mp;

  return { str, dex, int, vit, maxHp, maxMp, damagePercent: bonuses.damagePercent };
}

/** Recompute max HP/MP after equip change while preserving ratios. */
export function refreshPlayerDerivedStats(player, equipment) {
  const effective = getEffectiveCombatStats(player, equipment);
  const hpRatio = player.maxHp > 0 ? player.hp / player.maxHp : 1;
  const mpRatio = player.maxMp > 0 ? player.mp / player.maxMp : 1;

  player.maxHp = effective.maxHp;
  player.maxMp = effective.maxMp;
  player.hp = Math.min(player.maxHp, Math.max(1, Math.ceil(player.maxHp * hpRatio)));
  player.mp = Math.min(player.maxMp, Math.ceil(player.maxMp * mpRatio));
}
