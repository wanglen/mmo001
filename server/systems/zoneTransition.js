import { tileToPixel } from '../map/collision.js';
import { isInPortalRange } from '../../shared/portals.js';
import { MAP_ID } from '../../shared/worldMaps.js';

/**
 * Move a player to another instanced map through a portal.
 * @returns {{ ok: true, mapId: string } | { ok: false, reason: string }}
 */
export function usePortal({ world, player, portalId }) {
  if (!player || typeof portalId !== 'string') {
    return { ok: false, reason: 'invalid_request' };
  }

  const { map } = world.getContextForPlayer(player);
  const portal = map?.portals?.find((entry) => entry.id === portalId);
  if (!portal) return { ok: false, reason: 'invalid_portal' };
  if (!isInPortalRange(player.x, player.y, portal)) {
    return { ok: false, reason: 'out_of_range' };
  }

  const targetMap = world.getMap(portal.targetMapId);
  if (!targetMap) return { ok: false, reason: 'invalid_target' };

  const spawnPos = tileToPixel(portal.targetTile.x, portal.targetTile.y);
  player.mapId = portal.targetMapId;
  player.x = spawnPos.x;
  player.y = spawnPos.y;
  player.moving = false;
  player.attacking = false;
  player.attackTargetId = null;

  return { ok: true, mapId: player.mapId };
}

/** Respawn always returns the player to town. */
export function respawnToTown({ world, player }) {
  const town = world.getMap(MAP_ID.TOWN);
  if (!town) return { ok: false, reason: 'missing_town' };
  const spawnPos = tileToPixel(town.spawn.x, town.spawn.y);
  player.mapId = MAP_ID.TOWN;
  player.x = spawnPos.x;
  player.y = spawnPos.y;
  player.moving = false;
  return { ok: true, mapId: MAP_ID.TOWN };
}
