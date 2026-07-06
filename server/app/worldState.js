import { EVENTS } from '../../shared/events.js';
import { npcToJSON } from '../../shared/npcs.js';
import { serializeRemotePlayers } from '../../shared/playerSync.js';
import { APP_VERSION } from '../version.js';
import { clearAttackAnim } from '../systems/combat.js';
import { clearSkillAnim, collectActiveSkillFx } from '../systems/skills.js';
import { collectCombatFx } from '../systems/combatFx.js';
import { playerMapId } from './handlerUtils.js';

function serializePortals(portals = []) {
  return portals.map(({ id, label, x, y, targetMapId }) => ({
    id,
    label,
    x,
    y,
    targetMapId,
  }));
}

export function buildWorldState(world, playerManager, playerId, { includeMapTiles = true } = {}) {
  const now = Date.now();
  const player = playerManager.get(playerId);
  if (player) {
    clearAttackAnim(player, now);
    clearSkillAnim(player, now);
  }

  const mapId = playerMapId(player);
  const { map, monsterManager, lootManager } = world.getContext(mapId);

  const mapPayload = {
    mapId: map.mapId ?? mapId,
    width: map.width,
    height: map.height,
    spawn: map.spawn,
    zones: map.zones ?? [],
    portals: serializePortals(map.portals),
  };
  if (includeMapTiles) {
    mapPayload.tiles = map.tiles;
  }

  const sameMapPlayers = playerManager
    .getAllEntities()
    .filter((entry) => playerMapId(entry) === mapId);

  return {
    version: APP_VERSION,
    map: mapPayload,
    player: player ? player.toJSON(now) : null,
    players: serializeRemotePlayers(sameMapPlayers, playerId, now),
    monsters: monsterManager.getAll(),
    loot: lootManager.getAllForViewer(playerId, now),
    npcs: (map.npcs ?? map.npcsJson ?? []).map((entry) =>
      entry.dialogue ? entry : npcToJSON(entry)
    ),
    skillFx: collectActiveSkillFx(playerManager, now),
    combatFx: collectCombatFx(now),
  };
}

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
