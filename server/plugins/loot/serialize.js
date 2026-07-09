import { itemToJSON } from '../../../shared/items.js';
import { playerMapId } from '../../app/handlerUtils.js';
import { filterEntitiesForViewer } from '../../app/interest.js';
import { getOpenedChestKeys } from '../../../shared/dungeonChests.js';

/** @param {import('../players/Player.js').Player} player @param {number} [now] */
export function serializeLootPlayer(player, now = Date.now()) {
  const mapId = player.mapId;
  return {
    inventory: player.inventory.map(itemToJSON),
    stash: (player.stash ?? []).map(itemToJSON),
    equipment: Object.fromEntries(
      Object.entries(player.equipment).map(([slot, item]) => [slot, itemToJSON(item)])
    ),
    openedChests: getOpenedChestKeys(player, mapId),
  };
}

/** @param {import('../../shared/plugins/types.js').WorldSerializeContext} ctx */
export function serializeLootWorld(ctx) {
  const { world, playerManager, viewerId, now } = ctx;
  const player = playerManager.get(viewerId);
  const mapId = playerMapId(player);
  const { map, lootManager } = world.getContext(mapId);

  let loot = lootManager.getAllForViewer(viewerId, now);
  if (player) {
    loot = filterEntitiesForViewer(player.x, player.y, loot, map.width, map.height);
  }

  return { loot };
}
