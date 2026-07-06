import { EVENTS } from '../../../shared/events.js';
import {
  pickupLoot,
  equipFromInventory,
  unequipSlot,
  useConsumableFromInventory,
  destroyFromInventory,
  destroyFromEquipment,
} from '../../systems/inventory.js';
import { allocateStat } from '../../systems/progression.js';
import { interruptTownRecall } from '../../systems/townHub.js';
import { getLivingPlayer, getPlayerContext, persistPlayer } from '../../app/handlerUtils.js';
import { serializeLootPlayer, serializeLootWorld } from './serialize.js';
import { registerLootBusHandlers } from './bus.js';

export const LOOT_EVENTS = [
  EVENTS.USE_CONSUMABLE,
  EVENTS.PICKUP,
  EVENTS.EQUIP,
  EVENTS.UNEQUIP,
  EVENTS.DESTROY_ITEM,
  EVENTS.ALLOCATE_STAT,
];

/** @param {import('socket.io').Socket} socket @param {import('../../../shared/plugins/types.js').ServerContext} ctx */
export function registerLootHandlers(socket, ctx) {
  const { world, playerManager, characterStore, broadcastAll } = ctx;

  socket.on(EVENTS.USE_CONSUMABLE, async ({ inventoryIndex }) => {
    const player = getLivingPlayer(playerManager, socket.id);
    if (!player || !Number.isInteger(inventoryIndex)) return;

    const result = useConsumableFromInventory(player, inventoryIndex);
    if (!result.ok) {
      if (result.reason === 'full_hp' || result.reason === 'full_mp') return;
      socket.emit(EVENTS.ERROR, { message: `Cannot use item: ${result.reason}` });
      return;
    }

    await persistPlayer(characterStore, player);
    broadcastAll();
  });

  socket.on(EVENTS.PICKUP, async ({ lootId }) => {
    const player = getLivingPlayer(playerManager, socket.id);
    if (!player || typeof lootId !== 'string') return;

    interruptTownRecall(player);

    const { lootManager } = getPlayerContext(world, player);
    const result = pickupLoot({ player, lootId, lootManager });
    if (!result.ok) {
      socket.emit(EVENTS.ERROR, { message: `Cannot pick up: ${result.reason}` });
      return;
    }

    await persistPlayer(characterStore, player);
    broadcastAll();
  });

  socket.on(EVENTS.EQUIP, async ({ inventoryIndex }) => {
    const player = getLivingPlayer(playerManager, socket.id);
    if (!player || !Number.isInteger(inventoryIndex)) return;

    const result = equipFromInventory(player, inventoryIndex);
    if (!result.ok) {
      socket.emit(EVENTS.ERROR, { message: `Cannot equip: ${result.reason}` });
      return;
    }

    await persistPlayer(characterStore, player);
    broadcastAll();
  });

  socket.on(EVENTS.UNEQUIP, async ({ slot }) => {
    const player = getLivingPlayer(playerManager, socket.id);
    if (!player || typeof slot !== 'string') return;

    const result = unequipSlot(player, slot);
    if (!result.ok) {
      socket.emit(EVENTS.ERROR, { message: `Cannot unequip: ${result.reason}` });
      return;
    }

    await persistPlayer(characterStore, player);
    broadcastAll();
  });

  socket.on(EVENTS.DESTROY_ITEM, async ({ inventoryIndex, slot }) => {
    const player = getLivingPlayer(playerManager, socket.id);
    if (!player) return;

    const result = Number.isInteger(inventoryIndex)
      ? destroyFromInventory(player, inventoryIndex)
      : typeof slot === 'string'
        ? destroyFromEquipment(player, slot)
        : { ok: false, reason: 'invalid_target' };

    if (!result.ok) {
      socket.emit(EVENTS.ERROR, { message: `Cannot destroy item: ${result.reason}` });
      return;
    }

    await persistPlayer(characterStore, player);
    broadcastAll();
  });

  socket.on(EVENTS.ALLOCATE_STAT, async ({ stat }) => {
    const player = getLivingPlayer(playerManager, socket.id);
    if (!player || typeof stat !== 'string') return;

    const result = allocateStat(player, stat);
    if (!result.ok) {
      socket.emit(EVENTS.ERROR, { message: `Cannot allocate stat: ${result.reason}` });
      return;
    }

    await persistPlayer(characterStore, player);
    broadcastAll();
  });
}

/** @type {import('../../../shared/plugins/types.js').ServerPlugin} */
export const lootPlugin = {
  id: 'loot',
  dependsOn: ['core'],
  events: LOOT_EVENTS,
  registerServer: registerLootHandlers,
  registerBus: registerLootBusHandlers,
  serializePlayer: serializeLootPlayer,
  serializeWorld: serializeLootWorld,
};
