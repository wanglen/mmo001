import { DOMAIN_EVENTS } from '../../../shared/plugins/domainEvents.js';
import { addGold, rollMonsterGold } from '../../../shared/economy.js';
import { EVENTS } from '../../../shared/events.js';

function emitTradeState(io, tradeManager, playerManager, playerIds) {
  for (const playerId of playerIds) {
    const socket = io.sockets.sockets.get(playerId);
    if (!socket) continue;
    socket.emit(EVENTS.TRADE_STATE, tradeManager.getStateForPlayer(playerId, playerManager));
  }
}

/** @param {ReturnType<import('../../app/EventBus.js').createEventBus>} bus */
export function registerEconomyBusHandlers(bus) {
  bus.on(DOMAIN_EVENTS.MONSTER_KILLED, ({ killer, monster }) => {
    if (!killer || !monster?.type) return;
    addGold(killer, rollMonsterGold(monster.type));
  });

  bus.on(DOMAIN_EVENTS.PLAYER_DISCONNECT, ({ playerId, ctx }) => {
    if (!playerId || !ctx) return;

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
  });
}
