import { TILE_SIZE } from './constants.js';

export const PORTAL_USE_RANGE = 52;

/** Slightly larger hit area for clicking portals in the world. */
export const PORTAL_CLICK_RANGE = 72;

export function portalPixelFromTile(tileX, tileY) {
  return {
    x: tileX * TILE_SIZE + TILE_SIZE / 2,
    y: tileY * TILE_SIZE + TILE_SIZE / 2,
  };
}

/**
 * @param {{ id: string, label: string, tile: { x: number, y: number }, targetMapId: string, targetTile: { x: number, y: number } }} spec
 */
export function createPortal(spec) {
  const { x, y } = portalPixelFromTile(spec.tile.x, spec.tile.y);
  return {
    id: spec.id,
    label: spec.label,
    x,
    y,
    tile: spec.tile,
    targetMapId: spec.targetMapId,
    targetTile: spec.targetTile,
  };
}

export function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

export function isInPortalRange(playerX, playerY, portal, range = PORTAL_USE_RANGE) {
  return distance(playerX, playerY, portal.x, portal.y) <= range;
}

export function findPortalAt(portals, worldX, worldY, range = PORTAL_CLICK_RANGE) {
  if (!portals?.length) return null;
  let nearest = null;
  let nearestDist = range;
  for (const portal of portals) {
    const d = distance(worldX, worldY, portal.x, portal.y);
    if (d <= nearestDist) {
      nearest = portal;
      nearestDist = d;
    }
  }
  return nearest;
}
