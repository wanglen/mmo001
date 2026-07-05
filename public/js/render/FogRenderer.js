import { FOG_HIDDEN_COLOR, FOG_VOID_COLOR, isTileRevealed } from '/shared/fog.js';
import { TILE_SIZE } from '../config.js';

function fillFogRect(ctx, x, y, width, height, color) {
  const left = Math.floor(x);
  const top = Math.floor(y);
  const right = Math.ceil(x + width);
  const bottom = Math.ceil(y + height);
  ctx.fillStyle = color;
  ctx.fillRect(left, top, right - left + 1, bottom - top + 1);
}

export class FogRenderer {
  draw(ctx, map, camera, fogOfWar, canvasWidth, canvasHeight) {
    if (!map?.tiles || !fogOfWar) return;

    const bounds = camera.getViewBounds();
    const tileSize = camera.getScaledTileSize(TILE_SIZE);

    const startCol = Math.max(0, Math.floor(bounds.minX / TILE_SIZE) - 1);
    const startRow = Math.max(0, Math.floor(bounds.minY / TILE_SIZE) - 1);
    const endCol = Math.min(map.width, Math.ceil(bounds.maxX / TILE_SIZE) + 2);
    const endRow = Math.min(map.height, Math.ceil(bounds.maxY / TILE_SIZE) + 2);

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        if (isTileRevealed(fogOfWar.revealed, col, row)) continue;

        const worldX = col * TILE_SIZE;
        const worldY = row * TILE_SIZE;
        const screen = camera.worldToScreen(worldX, worldY);
        fillFogRect(ctx, screen.x, screen.y, tileSize.width, tileSize.height, FOG_HIDDEN_COLOR);
      }
    }

    ctx.fillStyle = FOG_VOID_COLOR;
    const mapW = map.width * TILE_SIZE;
    const mapH = map.height * TILE_SIZE;
    const topLeft = camera.worldToScreen(0, 0);
    const bottomRight = camera.worldToScreen(mapW, mapH);
    const left = Math.floor(topLeft.x);
    const top = Math.floor(topLeft.y);
    const right = Math.ceil(bottomRight.x);
    const bottom = Math.ceil(bottomRight.y);

    if (top > 0) ctx.fillRect(0, 0, canvasWidth, top);
    if (bottom < canvasHeight) ctx.fillRect(0, bottom, canvasWidth, canvasHeight - bottom);
    if (left > 0) ctx.fillRect(0, Math.max(0, top), left, Math.max(0, bottom - top));
    if (right < canvasWidth) {
      ctx.fillRect(right, Math.max(0, top), canvasWidth - right, Math.max(0, bottom - top));
    }
  }
}
