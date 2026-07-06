import { DOMAIN_EVENTS } from '../../../shared/plugins/domainEvents.js';
import { EVENTS } from '../../../shared/events.js';
import { buildOnlineList } from '../../../shared/social.js';

function emitPartyState(io, partyManager, playerManager, playerIds) {
  for (const playerId of playerIds) {
    const socket = io.sockets.sockets.get(playerId);
    if (!socket) continue;
    socket.emit(EVENTS.PARTY_STATE, partyManager.getPartyStateForPlayer(playerId, playerManager));
  }
}

/** @param {ReturnType<import('../../app/EventBus.js').createEventBus>} bus */
export function registerSocialBusHandlers(bus) {
  bus.on(DOMAIN_EVENTS.PLAYER_DISCONNECT, ({ playerId, ctx }) => {
    if (!playerId || !ctx) return;

    const { io, playerManager, partyManager } = ctx;
    const affected = partyManager.getAffectedPlayerIds(playerId);
    partyManager.onDisconnect(playerId);
    io.emit(EVENTS.ONLINE_PLAYERS, buildOnlineList(playerManager.getAllEntities()));
    if (affected.length) {
      emitPartyState(io, partyManager, playerManager, affected.filter((id) => id !== playerId));
    }
  });
}
