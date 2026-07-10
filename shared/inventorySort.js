import { ITEM_TYPES, RARITY, EQUIP_SLOTS } from './items.js';
import { INVENTORY_SIZE } from './inventory.js';
import { getStackCount } from './consumables.js';

const RARITY_RANK = {
  [RARITY.UNIQUE]: 0,
  [RARITY.RARE]: 1,
  [RARITY.MAGIC]: 2,
  [RARITY.COMMON]: 3,
};

const SLOT_RANK = Object.fromEntries(EQUIP_SLOTS.map((slot, index) => [slot, index]));

/** @param {object | null | undefined} item */
function categoryRank(item) {
  if (!item) return 99;
  if (item.type === ITEM_TYPES.CONSUMABLE) return 10;
  if (item.type === ITEM_TYPES.GEM) return 20;
  if (item.slot && SLOT_RANK[item.slot] !== undefined) return SLOT_RANK[item.slot];
  return 50;
}

/** @param {object | null | undefined} item */
function rarityRank(item) {
  if (!item?.rarity) return RARITY_RANK[RARITY.COMMON];
  return RARITY_RANK[item.rarity] ?? RARITY_RANK[RARITY.COMMON];
}

/**
 * Sort key for one inventory item (lower sorts first).
 * Order: equipment slot → rarity (best first) → name → stack size.
 * @param {object | null | undefined} item
 */
export function getInventorySortKey(item) {
  if (!item) {
    return {
      category: 99,
      rarity: 99,
      kind: '',
      name: '',
      stack: 0,
      id: '',
    };
  }

  return {
    category: categoryRank(item),
    rarity: rarityRank(item),
    kind: item.consumableKind ?? item.gemKind ?? item.type ?? '',
    name: (item.name ?? item.templateKey ?? '').toLowerCase(),
    stack: -getStackCount(item),
    id: item.id ?? '',
  };
}

/**
 * @param {object | null | undefined} a
 * @param {object | null | undefined} b
 */
export function compareInventoryItems(a, b) {
  const keyA = getInventorySortKey(a);
  const keyB = getInventorySortKey(b);

  if (keyA.category !== keyB.category) return keyA.category - keyB.category;
  if (keyA.rarity !== keyB.rarity) return keyA.rarity - keyB.rarity;
  if (keyA.kind !== keyB.kind) return keyA.kind.localeCompare(keyB.kind);
  if (keyA.name !== keyB.name) return keyA.name.localeCompare(keyB.name);
  if (keyA.stack !== keyB.stack) return keyA.stack - keyB.stack;
  return keyA.id.localeCompare(keyB.id);
}

/**
 * Return a new inventory array with items sorted to the front and empty slots trailing.
 * @param {Array<object | null>} inventory
 */
export function sortInventorySlots(inventory) {
  const size = inventory?.length ?? INVENTORY_SIZE;
  const items = (inventory ?? []).filter(Boolean);
  items.sort(compareInventoryItems);

  const sorted = new Array(size).fill(null);
  for (let i = 0; i < items.length && i < size; i++) {
    sorted[i] = items[i];
  }
  return sorted;
}
