import { TILE } from '/shared/constants.js';
import { TILE_SIZE } from '../config.js';

const TILE_COLORS = {
  [TILE.GRASS]: '#4a7c3f',
  [TILE.WATER]: '#3a7bd5',
  [TILE.TREE]: '#2d5016',
};

export class MapRenderer {
  draw(ctx, map, camera) {
    const bounds = camera.getViewBounds();
    const tileSize = camera.getScaledTileSize(TILE_SIZE);

    const startCol = Math.max(0, Math.floor(bounds.minX / TILE_SIZE) - 1);
    const startRow = Math.max(0, Math.floor(bounds.minY / TILE_SIZE) - 1);
    const endCol = Math.min(map.width, Math.ceil(bounds.maxX / TILE_SIZE) + 2);
    const endRow = Math.min(map.height, Math.ceil(bounds.maxY / TILE_SIZE) + 2);

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const tile = map.tiles[row][col];
        const worldX = col * TILE_SIZE;
        const worldY = row * TILE_SIZE;
        const screen = camera.worldToScreen(worldX, worldY);

        ctx.fillStyle = TILE_COLORS[tile] || '#333';
        ctx.fillRect(screen.x, screen.y, tileSize.width, tileSize.height);

        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.strokeRect(screen.x, screen.y, tileSize.width, tileSize.height);

        if (tile === TILE.TREE) {
          ctx.fillStyle = '#1a3310';
          ctx.beginPath();
          ctx.arc(
            screen.x + tileSize.width / 2,
            screen.y + tileSize.height / 2,
            tileSize.width / 3,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }
    }
  }
}
