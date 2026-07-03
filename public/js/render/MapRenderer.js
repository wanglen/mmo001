import { TILE } from '/shared/constants.js';
import { TILE_SIZE } from '../config.js';

const TILE_COLORS = {
  [TILE.GRASS]: '#4a7c3f',
  [TILE.WATER]: '#3a7bd5',
  [TILE.TREE]: '#2d5016',
};

export class MapRenderer {
  draw(ctx, map, camera) {
    const startCol = Math.max(0, Math.floor(camera.x / TILE_SIZE));
    const startRow = Math.max(0, Math.floor(camera.y / TILE_SIZE));
    const endCol = Math.min(map.width, Math.ceil((camera.x + ctx.canvas.width) / TILE_SIZE) + 1);
    const endRow = Math.min(map.height, Math.ceil((camera.y + ctx.canvas.height) / TILE_SIZE) + 1);

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const tile = map.tiles[row][col];
        const worldX = col * TILE_SIZE;
        const worldY = row * TILE_SIZE;
        const screen = camera.worldToScreen(worldX, worldY);

        ctx.fillStyle = TILE_COLORS[tile] || '#333';
        ctx.fillRect(screen.x, screen.y, TILE_SIZE, TILE_SIZE);

        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.strokeRect(screen.x, screen.y, TILE_SIZE, TILE_SIZE);

        if (tile === TILE.TREE) {
          ctx.fillStyle = '#1a3310';
          ctx.beginPath();
          ctx.arc(screen.x + TILE_SIZE / 2, screen.y + TILE_SIZE / 2, TILE_SIZE / 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }
}
