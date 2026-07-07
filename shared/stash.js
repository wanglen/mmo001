import { addItemToInventory } from './inventory.js';

export const STASH_COLS = 10;
export const STASH_ROWS = 6;
export const STASH_SIZE = STASH_COLS * STASH_ROWS;

export function createEmptyStash() {
  return new Array(STASH_SIZE).fill(null);
}

export function countEmptyStashSlots(stash) {
  return stash.filter((slot) => slot === null).length;
}

/**
 * @param {object[]} stash
 * @param {object} item
 */
export function addItemToStash(stash, item) {
  const index = stash.findIndex((slot) => slot === null);
  if (index === -1) return { ok: false, reason: 'stash_full' };
  stash[index] = item;
  return { ok: true, index };
}

/**
 * Move item from inventory to stash.
 * @param {object} player
 * @param {number} inventoryIndex
 */
export function storeInStash(player, inventoryIndex) {
  if (!Array.isArray(player.stash)) player.stash = createEmptyStash();
  if (!Number.isInteger(inventoryIndex) || inventoryIndex < 0 || inventoryIndex >= player.inventory.length) {
    return { ok: false, reason: 'invalid_index' };
  }

  const item = player.inventory[inventoryIndex];
  if (!item) return { ok: false, reason: 'empty_slot' };

  const result = addItemToStash(player.stash, item);
  if (!result.ok) return result;

  player.inventory[inventoryIndex] = null;
  return { ok: true, stashIndex: result.index };
}

/**
 * Move item from stash to inventory.
 * @param {object} player
 * @param {number} stashIndex
 */
export function takeFromStash(player, stashIndex) {
  if (!Array.isArray(player.stash)) player.stash = createEmptyStash();
  if (!Number.isInteger(stashIndex) || stashIndex < 0 || stashIndex >= player.stash.length) {
    return { ok: false, reason: 'invalid_index' };
  }

  const item = player.stash[stashIndex];
  if (!item) return { ok: false, reason: 'empty_slot' };

  const result = addItemToInventory(player.inventory, item);
  if (!result.ok) return result;

  player.stash[stashIndex] = null;
  return { ok: true, inventoryIndex: result.index };
}
