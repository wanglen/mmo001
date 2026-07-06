import { itemToJSON } from '../../../shared/items.js';
import { playerMapId } from '../../app/handlerUtils.js';

/** @param {import('../players/Player.js').Player} player */
export function serializeLootPlayer(player) {
  return {
    inventory: player.inventory.map(itemToJSON),
    equipment: Object.fromEntries(
      Object.entries(player.equipment).map(([slot, item]) => [slot, itemToJSON(item)])
    ),
  };
}

/** @param {import('../../shared/plugins/types.js').WorldSerializeContext} ctx */
export function serializeLootWorld(ctx) {
  const { world, playerManager, viewerId, now } = ctx;
  const player = playerManager.get(viewerId);
  const mapId = playerMapId(player);
  const { lootManager } = world.getContext(mapId);

  return {
    loot: lootManager.getAllForViewer(viewerId, now),
  };
}
