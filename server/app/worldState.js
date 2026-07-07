import { EVENTS } from '../../shared/events.js';
import { clearAttackAnim } from '../plugins/combat/combat.js';
import { clearSkillAnim } from '../plugins/combat/skills.js';
import { WorldStateSyncManager } from './WorldStateSync.js';
import { getServerTick } from './gameTickClock.js';

export function broadcastWorldState(
  io,
  world,
  playerManager,
  syncManager,
  { fullMapSocketIds = null, tick = getServerTick() } = {}
) {
  const now = Date.now();
  for (const player of playerManager.getAllEntities()) {
    clearAttackAnim(player, now);
    clearSkillAnim(player, now);
  }

  for (const [socketId, socket] of io.sockets.sockets) {
    const payload = syncManager.build(socketId, world, playerManager, {
      includeMapTiles: fullMapSocketIds?.has(socketId) ?? false,
      tick,
    });
    socket.emit(EVENTS.WORLD_STATE, payload);
  }
}

/** @returns {(options?: { teleportedIds?: Set<string> | null, tick?: number }) => void} */
export function createBroadcastAll(io, world, playerManager, syncManager = new WorldStateSyncManager()) {
  return ({ teleportedIds = null, tick = getServerTick() } = {}) =>
    broadcastWorldState(io, world, playerManager, syncManager, {
      fullMapSocketIds: teleportedIds,
      tick,
    });
}

export { buildWorldState } from './WorldStateBuilder.js';
export { WorldStateSyncManager } from './WorldStateSync.js';
