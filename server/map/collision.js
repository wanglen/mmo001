import { TILE_WALKABLE, TILE_SIZE } from '../../shared/constants.js';

export function getTileAt(map, tileX, tileY) {
  if (tileX < 0 || tileY < 0 || tileX >= map.width || tileY >= map.height) {
    return null;
  }
  return map.tiles[tileY][tileX];
}

export function isWalkable(map, tileX, tileY) {
  const tile = getTileAt(map, tileX, tileY);
  if (tile === null) return false;
  return TILE_WALKABLE[tile] === true;
}

export function pixelToTile(pixelX, pixelY) {
  return {
    x: Math.floor(pixelX / TILE_SIZE),
    y: Math.floor(pixelY / TILE_SIZE),
  };
}

export function tileToPixel(tileX, tileY) {
  return {
    x: tileX * TILE_SIZE + TILE_SIZE / 2,
    y: tileY * TILE_SIZE + TILE_SIZE / 2,
  };
}

export function canMoveTo(map, x, y, radius = 8) {
  const corners = [
    { x: x - radius, y: y - radius },
    { x: x + radius, y: y - radius },
    { x: x - radius, y: y + radius },
    { x: x + radius, y: y + radius },
  ];

  return corners.every(({ x: px, y: py }) => {
    const { x: tx, y: ty } = pixelToTile(px, py);
    return isWalkable(map, tx, ty);
  });
}
