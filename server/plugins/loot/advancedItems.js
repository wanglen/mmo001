import { isTownHubMap } from '../../../shared/townHub.js';
import { storeInStash, takeFromStash } from '../../../shared/stash.js';
import { socketGemIntoItem } from '../../../shared/plugins/items/sockets.js';
import { isGem } from '../../../shared/plugins/items/gems.js';
import { refreshPlayerDerivedStats } from '../../../shared/inventory.js';

export function stashStore(player, map, inventoryIndex) {
  if (!isTownHubMap(map)) return { ok: false, reason: 'not_in_town' };
  return storeInStash(player, inventoryIndex);
}

export function stashTake(player, map, stashIndex) {
  if (!isTownHubMap(map)) return { ok: false, reason: 'not_in_town' };
  return takeFromStash(player, stashIndex);
}

/**
 * Socket a gem from inventory into a gear item (inventory or equipped).
 *
 * @param {object} player
 * @param {object} options
 * @param {number} options.gemInventoryIndex
 * @param {number} [options.targetInventoryIndex]
 * @param {string} [options.targetSlot]
 */
export function socketGem(player, { gemInventoryIndex, targetInventoryIndex, targetSlot, socketIndex }) {
  if (!Number.isInteger(gemInventoryIndex)) return { ok: false, reason: 'invalid_gem' };

  const gem = player.inventory[gemInventoryIndex];
  if (!isGem(gem)) return { ok: false, reason: 'not_gem' };

  let targetItem = null;
  if (Number.isInteger(targetInventoryIndex)) {
    targetItem = player.inventory[targetInventoryIndex];
  } else if (typeof targetSlot === 'string') {
    targetItem = player.equipment[targetSlot];
  } else {
    return { ok: false, reason: 'invalid_target' };
  }

  if (!targetItem) return { ok: false, reason: 'empty_target' };

  const options = Number.isInteger(socketIndex) ? { socketIndex } : {};
  const result = socketGemIntoItem(targetItem, gem, options);
  if (!result.ok) return result;

  player.inventory[gemInventoryIndex] = result.replacedGem ?? null;
  refreshPlayerDerivedStats(player, player.equipment);
  return { ok: true, replaced: !!result.replaced };
}
