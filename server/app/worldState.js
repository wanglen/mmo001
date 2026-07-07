import { EVENTS } from '../../shared/events.js';
import { clearAttackAnim } from '../plugins/combat/combat.js';
import { clearSkillAnim } from '../plugins/combat/skills.js';
import { buildWorldState } from './WorldStateBuilder.js';

export function broadcastWorldState(io, world, playerManager, { fullMapSocketIds = null } = {}) {
  const now = Date.now();
  for (const player of playerManager.getAllEntities()) {
    clearAttackAnim(player, now);
    clearSkillAnim(player, now);
  }
  for (const [, socket] of io.sockets.sockets) {
    socket.emit(
      EVENTS.WORLD_STATE,
      buildWorldState(world, playerManager, socket.id, {
        includeMapTiles: fullMapSocketIds?.has(socket.id) ?? false,
      })
    );
  }
}

/** @returns {(options?: { teleportedIds?: Set<string> | null }) => void} */
export function createBroadcastAll(io, world, playerManager) {
  return ({ teleportedIds = null } = {}) =>
    broadcastWorldState(io, world, playerManager, { fullMapSocketIds: teleportedIds });
}

export { buildWorldState } from './WorldStateBuilder.js';
