import { addGold, getSellPrice } from './economy.js';
import { getStackCount, isConsumable } from './consumables.js';

function potionGroupKey(item) {
  return `${item.templateKey}:${item.rarity ?? 'common'}`;
}

function matchesPotionGroup(item, templateKey, rarity) {
  return (
    isConsumable(item) &&
    item.templateKey === templateKey &&
    (item.rarity ?? 'common') === rarity &&
    getSellPrice(item) > 0
  );
}

/**
 * Build vendor sell rows: potions grouped by template + rarity, gear one row per slot.
 * @param {Array<object | null>} inventory
 * @returns {Array<{ kind: 'potion_stack', templateKey: string, rarity: string, name: string, totalCount: number, unitPrice: number } | { kind: 'slot', index: number, item: object, unitPrice: number }>}
 */
export function buildVendorSellRows(inventory) {
  if (!inventory?.length) return [];

  const potionGroups = new Map();
  const gearRows = [];

  inventory.forEach((item, index) => {
    if (!item) return;
    const unitPrice = getSellPrice(item);
    if (unitPrice <= 0) return;

    if (isConsumable(item) && item.templateKey) {
      const key = potionGroupKey(item);
      const existing = potionGroups.get(key);
      const count = getStackCount(item);
      if (existing) {
        existing.totalCount += count;
      } else {
        potionGroups.set(key, {
          kind: 'potion_stack',
          templateKey: item.templateKey,
          rarity: item.rarity ?? 'common',
          name: item.name,
          totalCount: count,
          unitPrice,
        });
      }
      return;
    }

    gearRows.push({ kind: 'slot', index, item, unitPrice });
  });

  return [...potionGroups.values(), ...gearRows];
}

/**
 * Stable signature for vendor sell list re-renders.
 * @param {Array<object | null>} inventory
 */
export function buildVendorSellSignature(inventory) {
  return buildVendorSellRows(inventory)
    .map((row) => {
      if (row.kind === 'potion_stack') {
        return `p:${row.templateKey}:${row.rarity}:${row.totalCount}:${row.unitPrice}`;
      }
      return `s:${row.index}:${row.item.id ?? row.item.name}:${row.item.rarity ?? 'common'}`;
    })
    .join('|');
}

/**
 * Sell a quantity of stacked potions (may span multiple bag slots).
 * @param {object} player
 * @param {string} templateKey
 * @param {number} quantity
 * @param {string} [rarity='common']
 */
export function sellPotionsToVendor(player, templateKey, quantity, rarity = 'common') {
  if (typeof templateKey !== 'string' || !templateKey) {
    return { ok: false, reason: 'invalid_template' };
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    return { ok: false, reason: 'invalid_quantity' };
  }

  let available = 0;
  let unitPrice = 0;
  for (const item of player.inventory ?? []) {
    if (!matchesPotionGroup(item, templateKey, rarity)) continue;
    available += getStackCount(item);
    unitPrice = getSellPrice(item);
  }

  if (unitPrice <= 0) return { ok: false, reason: 'unsellable' };
  if (available < quantity) return { ok: false, reason: 'not_enough' };

  let remaining = quantity;
  for (let i = 0; i < player.inventory.length && remaining > 0; i++) {
    const item = player.inventory[i];
    if (!matchesPotionGroup(item, templateKey, rarity)) continue;

    const stack = getStackCount(item);
    const take = Math.min(stack, remaining);
    if (take >= stack) {
      player.inventory[i] = null;
    } else {
      item.stackCount = stack - take;
    }
    remaining -= take;
  }

  const goldGained = unitPrice * quantity;
  addGold(player, goldGained);
  return { ok: true, goldGained, quantitySold: quantity };
}
