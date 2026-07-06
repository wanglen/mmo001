import { statsToJSON } from '../../../shared/stats.js';
import { getEffectiveCombatStats } from '../../../shared/inventory.js';
import { APP_VERSION } from '../../version.js';
import { npcToJSON } from '../../../shared/npcs.js';
import { serializeRemotePlayers } from '../../../shared/playerSync.js';
import { playerMapId } from '../../app/handlerUtils.js';

function serializePortals(portals = []) {
  return portals.map(({ id, label, x, y, targetMapId }) => ({
    id,
    label,
    x,
    y,
    targetMapId,
  }));
}

/** @param {import('../players/Player.js').Player} player @param {number} _now */
export function serializeCorePlayer(player, _now) {
  const effective = getEffectiveCombatStats(player, player.equipment);

  return {
    id: player.id,
    name: player.name,
    characterClass: player.characterClass,
    mapId: player.mapId,
    x: player.x,
    y: player.y,
    direction: player.direction,
    facing: player.facing,
    aimX: player.aimX,
    aimY: player.aimY,
    moving: player.moving,
    attacking: player.attacking,
    dead: !!player.dead,
    townRecallCasting: !!player.townRecallCasting,
    townRecallCastMs: player.townRecallCasting ? (player.townRecallCastMs ?? 0) : 0,
    ...statsToJSON(player),
    str: effective.str,
    dex: effective.dex,
    int: effective.int,
    vit: effective.vit,
    maxHp: effective.maxHp,
    maxMp: effective.maxMp,
  };
}

/** @param {import('../../shared/plugins/types.js').WorldSerializeContext} ctx */
export function serializeCoreWorld(ctx) {
  const { world, playerManager, viewerId, now, includeMapTiles, composePlayer } = ctx;
  const player = playerManager.get(viewerId);
  const mapId = playerMapId(player);
  const { map } = world.getContext(mapId);

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
    player: player ? composePlayer(player) : null,
    players: serializeRemotePlayers(sameMapPlayers, viewerId, now),
    npcs: (map.npcs ?? map.npcsJson ?? []).map((entry) =>
      entry.dialogue ? entry : npcToJSON(entry)
    ),
  };
}
