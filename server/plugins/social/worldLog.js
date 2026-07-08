import { EVENTS } from '../../../shared/events.js';

/**
 * @param {import('socket.io').Server} io
 * @param {string} playerId
 * @param {import('../../../shared/worldLog.js').WorldEvent} event
 */
export function emitWorldEvent(io, playerId, event) {
  if (!io || !playerId || !event?.text) return;
  io.to(playerId).emit(EVENTS.WORLD_EVENT, event);
}

/**
 * @param {import('socket.io').Server} io
 * @param {string[]} playerIds
 * @param {import('../../../shared/worldLog.js').WorldEvent} event
 */
export function emitWorldEventToPlayers(io, playerIds, event) {
  if (!io || !event?.text || !playerIds?.length) return;
  for (const playerId of playerIds) {
    emitWorldEvent(io, playerId, event);
  }
}
