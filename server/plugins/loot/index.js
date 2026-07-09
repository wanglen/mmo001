import { EVENTS } from '../../../shared/events.js';
import {
  pickupLoot,
  equipFromInventory,
  unequipSlot,
  useConsumableFromInventory,
  destroyFromInventory,
  destroyFromEquipment,
} from './inventory.js';
import { stashStore, stashTake, socketGem } from './advancedItems.js';
import { allocateStat } from './progression.js';
import { interruptTownRecall } from '../core/townHub.js';
import { getLivingPlayer, getPlayerContext, persistPlayer } from '../../app/handlerUtils.js';
import { serializeLootPlayer, serializeLootWorld } from './serialize.js';
import { registerLootBusHandlers } from './bus.js';
import { emitWorldEvent } from '../social/worldLog.js';
import { formatLootEvent } from '../../../shared/worldLog.js';
import { openDungeonChest } from './chests.js';

export const LOOT_EVENTS = [
  EVENTS.USE_CONSUMABLE,
  EVENTS.PICKUP,
  EVENTS.EQUIP,
  EVENTS.UNEQUIP,
  EVENTS.DESTROY_ITEM,
  EVENTS.ALLOCATE_STAT,
  EVENTS.STASH_STORE,
  EVENTS.STASH_TAKE,
  EVENTS.SOCKET_GEM,
  EVENTS.OPEN_CHEST,
];

/** @param {import('socket.io').Socket} socket @param {import('../../../shared/plugins/types.js').ServerContext} ctx */
export function registerLootHandlers(socket, ctx) {
  const { world, playerManager, characterStore, broadcastAll, io } = ctx;

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

    emitWorldEvent(io, player.id, formatLootEvent(result.item?.name));

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

  socket.on(EVENTS.STASH_STORE, async ({ inventoryIndex }) => {
    const player = getLivingPlayer(playerManager, socket.id);
    if (!player || !Number.isInteger(inventoryIndex)) return;

    const { map } = getPlayerContext(world, player);
    const result = stashStore(player, map, inventoryIndex);
    if (!result.ok) {
      socket.emit(EVENTS.ERROR, { message: `Cannot store item: ${result.reason}` });
      return;
    }

    await persistPlayer(characterStore, player);
    broadcastAll();
  });

  socket.on(EVENTS.STASH_TAKE, async ({ stashIndex }) => {
    const player = getLivingPlayer(playerManager, socket.id);
    if (!player || !Number.isInteger(stashIndex)) return;

    const { map } = getPlayerContext(world, player);
    const result = stashTake(player, map, stashIndex);
    if (!result.ok) {
      socket.emit(EVENTS.ERROR, { message: `Cannot take item: ${result.reason}` });
      return;
    }

    await persistPlayer(characterStore, player);
    broadcastAll();
  });

  socket.on(EVENTS.SOCKET_GEM, async ({ gemInventoryIndex, targetInventoryIndex, targetSlot, socketIndex }) => {
    const player = getLivingPlayer(playerManager, socket.id);
    if (!player || !Number.isInteger(gemInventoryIndex)) return;

    const options = { gemInventoryIndex, targetInventoryIndex, targetSlot };
    if (Number.isInteger(socketIndex)) options.socketIndex = socketIndex;

    const result = socketGem(player, options);
    if (!result.ok) {
      socket.emit(EVENTS.ERROR, { message: `Cannot socket gem: ${result.reason}` });
      return;
    }

    await persistPlayer(characterStore, player);
    broadcastAll();
  });

  socket.on(EVENTS.OPEN_CHEST, async ({ tileX, tileY }) => {
    const player = getLivingPlayer(playerManager, socket.id);
    if (!player) return;

    const { map } = getPlayerContext(world, player);
    const col = Number(tileX);
    const row = Number(tileY);
    if (!Number.isInteger(col) || !Number.isInteger(row)) return;

    interruptTownRecall(player);

    const result = openDungeonChest({ player, map, tileX: col, tileY: row });
    if (!result.ok) {
      const silent = result.reason === 'already_opened' || result.reason === 'no_chest';
      if (!silent) {
        const messages = {
          out_of_range: 'Stand closer to open the chest',
          inventory_full: 'Inventory full',
          not_dungeon: 'Cannot open chest here',
        };
        socket.emit(EVENTS.ERROR, {
          message: messages[result.reason] ?? 'Cannot open chest',
        });
      }
      return;
    }

    if (result.item) {
      emitWorldEvent(io, player.id, formatLootEvent(result.item.name));
    } else if (result.gold) {
      emitWorldEvent(io, player.id, formatLootEvent(`${result.gold} gold`));
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
