import { EVENTS } from '../../../shared/events.js';
import {
  buyFromVendor,
  sellToVendor,
  validateVendorInteraction,
} from '../../systems/vendors.js';
import { serializeEconomyPlayer } from './serialize.js';

const TRADE_ERROR_MESSAGES = {
  invalid_target: 'Invalid trade target',
  self: 'Cannot trade with yourself',
  in_trade: 'Already in a trade',
  pending_exists: 'Trade request already pending',
  different_map: 'Both characters must be on the same map to trade',
  out_of_range: 'Stand near the other player to trade',
  dead: 'Cannot trade while dead',
  no_request: 'No trade request',
  requester_gone: 'Trade partner is offline',
  not_ready: 'Both players must be ready',
};

function tradeErrorMessage(reason, fallback = 'Cannot start trade') {
  return TRADE_ERROR_MESSAGES[reason] ?? fallback;
}

function emitTradeState(io, tradeManager, playerManager, playerIds) {
  for (const playerId of playerIds) {
    const socket = io.sockets.sockets.get(playerId);
    if (!socket) continue;
    socket.emit(EVENTS.TRADE_STATE, tradeManager.getStateForPlayer(playerId, playerManager));
  }
}

export const ECONOMY_EVENTS = [
  EVENTS.VENDOR_OPEN,
  EVENTS.VENDOR_BUY,
  EVENTS.VENDOR_SELL,
  EVENTS.TRADE_REQUEST,
  EVENTS.TRADE_ACCEPT,
  EVENTS.TRADE_DECLINE,
  EVENTS.TRADE_CANCEL,
  EVENTS.TRADE_UPDATE,
  EVENTS.TRADE_READY,
];

/** @param {import('socket.io').Socket} socket @param {import('../../../shared/plugins/types.js').ServerContext} ctx */
export function registerEconomyHandlers(socket, ctx) {
  const { io, world, playerManager, tradeManager, characterStore, broadcastAll } = ctx;

  async function persist(player) {
    if (player) await characterStore.save(player);
  }

  socket.on(EVENTS.VENDOR_OPEN, ({ npcId }) => {
    const player = playerManager.get(socket.id);
    if (!player || typeof npcId !== 'string') {
      socket.emit(EVENTS.ERROR, { message: 'Cannot open vendor' });
      return;
    }

    const { map } = world.getContextForPlayer(player);
    const npcs = map.npcs ?? map.npcsJson ?? [];
    const check = validateVendorInteraction(player, npcs, npcId);
    if (!check.ok) {
      socket.emit(EVENTS.ERROR, { message: 'Cannot open vendor' });
      return;
    }

    player.activeVendorNpcId = npcId;
    socket.emit(EVENTS.VENDOR_CATALOG, { catalog: check.catalog, npcId });
  });

  socket.on(EVENTS.VENDOR_BUY, async ({ npcId, templateKey }) => {
    const player = playerManager.get(socket.id);
    const vendorNpcId = typeof npcId === 'string' ? npcId : player?.activeVendorNpcId;
    if (!player || typeof vendorNpcId !== 'string' || typeof templateKey !== 'string') {
      socket.emit(EVENTS.ERROR, { message: 'Cannot buy from vendor' });
      return;
    }

    const { map } = world.getContextForPlayer(player);
    const npcs = map.npcs ?? map.npcsJson ?? [];
    const check = validateVendorInteraction(player, npcs, vendorNpcId, { requireRange: false });
    if (!check.ok) {
      socket.emit(EVENTS.ERROR, { message: 'Cannot buy from vendor' });
      return;
    }

    const result = buyFromVendor(player, check.vendorId, templateKey);
    if (!result.ok) {
      const messages = {
        not_enough_gold: 'Not enough gold',
        full: 'Inventory full',
        not_in_stock: 'Item not in stock',
      };
      socket.emit(EVENTS.ERROR, { message: messages[result.reason] ?? 'Cannot buy item' });
      return;
    }

    await persist(player);
    broadcastAll();
  });

  socket.on(EVENTS.VENDOR_SELL, async ({ npcId, inventoryIndex }) => {
    const player = playerManager.get(socket.id);
    const vendorNpcId = typeof npcId === 'string' ? npcId : player?.activeVendorNpcId;
    const index = Number(inventoryIndex);
    if (!player || typeof vendorNpcId !== 'string') {
      socket.emit(EVENTS.ERROR, { message: 'Cannot sell to vendor' });
      return;
    }
    if (!Number.isInteger(index) || index < 0) {
      socket.emit(EVENTS.ERROR, { message: 'Invalid item slot' });
      return;
    }

    const { map } = world.getContextForPlayer(player);
    const npcs = map.npcs ?? map.npcsJson ?? [];
    const check = validateVendorInteraction(player, npcs, vendorNpcId, { requireRange: false });
    if (!check.ok) {
      const messages = {
        out_of_range: 'Stand near the vendor to sell',
        not_vendor: 'Cannot sell to this NPC',
      };
      socket.emit(EVENTS.ERROR, { message: messages[check.reason] ?? 'Cannot sell to vendor' });
      return;
    }

    const result = sellToVendor(player, index);
    if (!result.ok) {
      const messages = {
        empty_slot: 'Item no longer in bag',
        unsellable: 'This item cannot be sold',
        invalid_index: 'Invalid item slot',
      };
      socket.emit(EVENTS.ERROR, { message: messages[result.reason] ?? 'Cannot sell item' });
      return;
    }

    await persist(player);
    broadcastAll();
  });

  socket.on(EVENTS.TRADE_REQUEST, ({ targetName }) => {
    const player = playerManager.get(socket.id);
    if (!player || typeof targetName !== 'string') return;

    const target = playerManager.findByName(targetName);
    if (!target) {
      socket.emit(EVENTS.ERROR, { message: 'Player not found' });
      return;
    }

    const result = tradeManager.request(player, target);
    if (!result.ok) {
      socket.emit(EVENTS.ERROR, { message: tradeErrorMessage(result.reason) });
      return;
    }

    emitTradeState(io, tradeManager, playerManager, [player.id, target.id]);
  });

  socket.on(EVENTS.TRADE_ACCEPT, () => {
    const player = playerManager.get(socket.id);
    if (!player) return;

    const pending = tradeManager.pendingByTarget.get(player.id);
    if (!pending) {
      socket.emit(EVENTS.ERROR, { message: 'No trade request' });
      return;
    }

    const requester = playerManager.get(pending.fromId);
    const result = tradeManager.accept(player, requester);
    if (!result.ok) {
      socket.emit(EVENTS.ERROR, { message: tradeErrorMessage(result.reason, 'Cannot accept trade') });
      return;
    }

    emitTradeState(io, tradeManager, playerManager, [result.session.playerAId, result.session.playerBId]);
  });

  socket.on(EVENTS.TRADE_DECLINE, () => {
    const player = playerManager.get(socket.id);
    if (!player) return;

    const result = tradeManager.decline(player);
    if (result.ok && result.fromId) {
      emitTradeState(io, tradeManager, playerManager, [player.id, result.fromId]);
    }
  });

  socket.on(EVENTS.TRADE_CANCEL, () => {
    const player = playerManager.get(socket.id);
    if (!player) return;

    const result = tradeManager.cancelRequest(player.id);
    if (result.ok) {
      emitTradeState(io, tradeManager, playerManager, [player.id, result.targetId]);
      return;
    }

    const cancelled = tradeManager.cancelTrade(player.id);
    if (cancelled.ok) {
      emitTradeState(io, tradeManager, playerManager, cancelled.partnerIds);
    }
  });

  socket.on(EVENTS.TRADE_UPDATE, ({ gold, slots }) => {
    const player = playerManager.get(socket.id);
    if (!player) return;

    const result = tradeManager.updateOffer(player.id, { gold, slots });
    if (!result.ok) {
      socket.emit(EVENTS.ERROR, { message: 'Invalid trade offer' });
      return;
    }

    emitTradeState(io, tradeManager, playerManager, [result.session.playerAId, result.session.playerBId]);
  });

  socket.on(EVENTS.TRADE_READY, async ({ ready }) => {
    const player = playerManager.get(socket.id);
    if (!player) return;

    const result = tradeManager.setReady(player.id, ready);
    if (!result.ok) return;

    const session = result.session;
    if (result.bothReady) {
      const playerA = playerManager.get(session.playerAId);
      const playerB = playerManager.get(session.playerBId);
      const executed = tradeManager.executeTrade(session, playerA, playerB);
      if (!executed.ok) {
        session.offerA.ready = false;
        session.offerB.ready = false;
        socket.emit(EVENTS.ERROR, { message: 'Trade failed' });
        emitTradeState(io, tradeManager, playerManager, [session.playerAId, session.playerBId]);
        return;
      }

      await persist(playerA);
      await persist(playerB);
      tradeManager.endSession(session.id);
      broadcastAll();
      emitTradeState(io, tradeManager, playerManager, [session.playerAId, session.playerBId]);
      return;
    }

    emitTradeState(io, tradeManager, playerManager, [session.playerAId, session.playerBId]);
  });

  socket.emit(EVENTS.TRADE_STATE, tradeManager.getStateForPlayer(socket.id, playerManager));
}

/** @param {string} playerId @param {import('../../../shared/plugins/types.js').ServerContext} ctx */
export function onEconomyDisconnect(playerId, ctx) {
  const { io, tradeManager, playerManager } = ctx;
  tradeManager.onDisconnect(playerId);
  const affected = new Set([playerId]);
  for (const entry of tradeManager.sessions.values()) {
    if (entry.playerAId === playerId || entry.playerBId === playerId) {
      affected.add(entry.playerAId);
      affected.add(entry.playerBId);
    }
  }
  emitTradeState(io, tradeManager, playerManager, [...affected].filter((id) => id !== playerId));
}

/** @type {import('../../../shared/plugins/types.js').ServerPlugin} */
export const economyPlugin = {
  id: 'economy',
  dependsOn: ['core', 'loot'],
  events: ECONOMY_EVENTS,
  registerServer: registerEconomyHandlers,
  onDisconnect: onEconomyDisconnect,
  serializePlayer: serializeEconomyPlayer,
};
