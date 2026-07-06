import { TILE } from './constants.js';

export const MINIMAP_MAX_WIDTH = 168;
export const MINIMAP_MAX_HEIGHT = 126;
export const MINIMAP_MARGIN = 16;
/** Vertical offset below the zone badge (badge top + height + gap). */
export const MINIMAP_TOP_OFFSET = 52;

/** @returns {number} pixels per map tile on the minimap (≤ 1). */
export function minimapScale(mapWidth, mapHeight, maxWidth = MINIMAP_MAX_WIDTH, maxHeight = MINIMAP_MAX_HEIGHT) {
  if (!mapWidth || !mapHeight) return 1;
  return Math.min(maxWidth / mapWidth, maxHeight / mapHeight, 1);
}

/** @returns {{ scale: number, width: number, height: number }} */
export function minimapDimensions(mapWidth, mapHeight, maxWidth = MINIMAP_MAX_WIDTH, maxHeight = MINIMAP_MAX_HEIGHT) {
  const scale = minimapScale(mapWidth, mapHeight, maxWidth, maxHeight);
  return {
    scale,
    width: mapWidth * scale,
    height: mapHeight * scale,
  };
}

/** Screen position for the minimap panel (top-right, below zone badge). */
export function minimapScreenRect(canvasWidth, mapWidth, mapHeight, margin = MINIMAP_MARGIN) {
  const { width, height } = minimapDimensions(mapWidth, mapHeight);
  return {
    x: canvasWidth - margin - width,
    y: MINIMAP_TOP_OFFSET,
    width,
    height,
  };
}

/** World tile → minimap pixel within the panel. */
export function minimapTileRect(mapWidth, mapHeight, tileX, tileY, panelX, panelY, maxWidth, maxHeight) {
  const { scale } = minimapDimensions(mapWidth, mapHeight, maxWidth, maxHeight);
  const size = Math.max(1, scale);
  return {
    x: panelX + tileX * scale,
    y: panelY + tileY * scale,
    width: size,
    height: size,
  };
}

/** Distinct colors for terrain and dungeon landmarks on the minimap. */
export function minimapTileColor(tile) {
  switch (tile) {
    case TILE.GRASS:
      return '#4a7c3f';
    case TILE.WATER:
      return '#2f6eb5';
    case TILE.TREE:
      return '#2d5016';
    case TILE.ROCK:
      return '#4a4038';
    case TILE.WALL:
      return '#3a3340';
    case TILE.DOOR:
      return '#6b4a2a';
    case TILE.CHEST:
      return '#c49a2a';
    default:
      return '#333944';
  }
}

/** Player position in minimap pixel coordinates (center of dot). */
export function minimapPlayerPoint(mapWidth, mapHeight, pixelX, pixelY, tileSize, panelX, panelY, maxWidth, maxHeight) {
  const { scale } = minimapDimensions(mapWidth, mapHeight, maxWidth, maxHeight);
  return {
    x: panelX + (pixelX / tileSize) * scale,
    y: panelY + (pixelY / tileSize) * scale,
  };
}
