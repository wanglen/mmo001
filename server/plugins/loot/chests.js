import { tileToPixel } from '../../map/collision.js';
import { addItemToInventory } from '../../../shared/inventory.js';
import { rollChestLoot } from '../../../shared/items.js';
import { isInstancedDungeonMap } from '../../../shared/dungeon.js';
import {
  chestTileKey,
  CHEST_OPEN_RANGE,
  hasOpenedChest,
  isInChestOpenRange,
  markChestOpened,
  tileHasChest,
} from '../../../shared/dungeonChests.js';
import { isLootPickupInRange } from '../../../shared/plugins/core/anticheat.js';

/**
 * @param {object} params
 * @param {object} params.player
 * @param {object} params.map
 * @param {number} params.tileX
 * @param {number} params.tileY
 * @param {() => number} [params.random]
 */
export function openDungeonChest({ player, map, tileX, tileY, random = Math.random }) {
  if (!player || !map) return { ok: false, reason: 'invalid' };
  if (!isInstancedDungeonMap(map)) return { ok: false, reason: 'not_dungeon' };
  if (!Number.isInteger(tileX) || !Number.isInteger(tileY)) {
    return { ok: false, reason: 'invalid_tile' };
  }
  if (!tileHasChest(map, tileX, tileY)) return { ok: false, reason: 'no_chest' };

  const mapId = map.mapId;
  const key = chestTileKey(tileX, tileY);
  if (hasOpenedChest(player, mapId, key)) return { ok: false, reason: 'already_opened' };

  const { x, y } = tileToPixel(tileX, tileY);
  if (!isInChestOpenRange(player.x, player.y, x, y)) {
    return { ok: false, reason: 'out_of_range' };
  }
  if (!isLootPickupInRange(player.x, player.y, x, y, CHEST_OPEN_RANGE, 6)) {
    return { ok: false, reason: 'out_of_range' };
  }

  const reward = rollChestLoot(random);

  if (reward.kind === 'gold') {
    markChestOpened(player, mapId, key);
    player.gold = (player.gold ?? 0) + reward.gold;
    return { ok: true, key, gold: reward.gold };
  }

  const added = addItemToInventory(player.inventory, reward.item);
  if (!added.ok) {
    return { ok: false, reason: added.reason ?? 'inventory_full' };
  }

  markChestOpened(player, mapId, key);
  return { ok: true, key, item: reward.item };
}
