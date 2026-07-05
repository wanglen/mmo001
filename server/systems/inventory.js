import { distance } from '../../shared/combat.js';
import {
  addItemToInventory,
  PICKUP_RANGE,
  refreshPlayerDerivedStats,
} from '../../shared/inventory.js';
import { EQUIP_SLOTS } from '../../shared/items.js';
import { applyConsumable } from '../../shared/consumables.js';

export function pickupLoot({ player, lootId, lootManager }) {
  const drop = lootManager.get(lootId);
  if (!drop) return { ok: false, reason: 'not_found' };

  if (distance(player.x, player.y, drop.x, drop.y) > PICKUP_RANGE) {
    return { ok: false, reason: 'out_of_range' };
  }

  const result = addItemToInventory(player.inventory, drop.item);
  if (!result.ok) return result;

  lootManager.remove(lootId);
  return { ok: true, index: result.index };
}

export function useConsumableFromInventory(player, inventoryIndex) {
  if (!Number.isInteger(inventoryIndex) || inventoryIndex < 0 || inventoryIndex >= player.inventory.length) {
    return { ok: false, reason: 'invalid_index' };
  }

  const item = player.inventory[inventoryIndex];
  if (!item) return { ok: false, reason: 'empty_slot' };

  const result = applyConsumable(player, item);
  if (!result.ok) return result;

  player.inventory[inventoryIndex] = null;
  return result;
}

export function equipFromInventory(player, inventoryIndex) {
  if (!Number.isInteger(inventoryIndex) || inventoryIndex < 0 || inventoryIndex >= player.inventory.length) {
    return { ok: false, reason: 'invalid_index' };
  }

  const item = player.inventory[inventoryIndex];
  if (!item) return { ok: false, reason: 'empty_slot' };
  if (!EQUIP_SLOTS.includes(item.slot)) return { ok: false, reason: 'not_equippable' };

  const slot = item.slot;
  const previous = player.equipment[slot];
  player.equipment[slot] = item;
  player.inventory[inventoryIndex] = previous;
  refreshPlayerDerivedStats(player, player.equipment);

  return { ok: true, slot };
}

export function unequipSlot(player, slot) {
  if (!EQUIP_SLOTS.includes(slot)) return { ok: false, reason: 'invalid_slot' };

  const item = player.equipment[slot];
  if (!item) return { ok: false, reason: 'empty_slot' };

  const result = addItemToInventory(player.inventory, item);
  if (!result.ok) return result;

  player.equipment[slot] = null;
  refreshPlayerDerivedStats(player, player.equipment);

  return { ok: true, index: result.index };
}
