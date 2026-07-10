import { MAP_ID } from '/shared/worldMaps.js';
import { TILE } from '/shared/constants.js';
import { TILE_SIZE } from '../config.js';

function tileSeed(col, row) {
  return col * 615241 + row * 913573;
}

function isMapEdge(map, col, row) {
  return col === 0 || row === 0 || col === map.width - 1 || row === map.height - 1;
}

function drawSandRipples(ctx, x, y, w, h, col, row) {
  const seed = tileSeed(col, row);
  ctx.strokeStyle = 'rgba(120, 90, 40, 0.35)';
  ctx.lineWidth = Math.max(1, w * 0.04);
  for (let i = 0; i < 2; i++) {
    const t = (seed + i * 97) % 503;
    ctx.beginPath();
    const y0 = y + h * (0.25 + (t % 50) / 100);
    ctx.moveTo(x + w * 0.1, y0);
    ctx.quadraticCurveTo(x + w * 0.5, y0 + h * 0.08, x + w * 0.9, y0 - h * 0.04);
    ctx.stroke();
  }
}

function drawDesertDune(ctx, x, y, w, h, col, row) {
  const seed = tileSeed(col, row);
  const cx = x + w / 2 + ((seed % 7) - 3);
  const cy = y + h / 2 + (((seed >> 3) % 7) - 3);

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.55);
  grad.addColorStop(0, '#e8d090');
  grad.addColorStop(0.55, '#c4a35a');
  grad.addColorStop(1, '#9a7848');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(cx, cy, w * 0.48, h * 0.36, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 240, 200, 0.25)';
  ctx.beginPath();
  ctx.ellipse(cx - w * 0.12, cy - h * 0.08, w * 0.18, h * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
}

export class DesertRenderer {
  draw(ctx, map, camera, tileSize, startCol, startRow, endCol, endRow) {
    if (map?.mapId !== MAP_ID.DESERT) return;

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const tile = map.tiles[row]?.[col];
        if (tile !== TILE.GRASS && tile !== TILE.ROCK) continue;

        const worldX = col * TILE_SIZE;
        const worldY = row * TILE_SIZE;
        const screen = camera.worldToScreen(worldX, worldY);
        const w = tileSize.width;
        const h = tileSize.height;
        const { x, y } = screen;

        if (tile === TILE.GRASS) {
          ctx.fillStyle = 'rgba(255, 220, 140, 0.12)';
          ctx.fillRect(x, y, w, h);
          drawSandRipples(ctx, x, y, w, h, col, row);
        }

        if (tile === TILE.ROCK && !isMapEdge(map, col, row)) {
          drawDesertDune(ctx, x, y, w, h, col, row);
        }
      }
    }
  }
}

export { isMapEdge };
