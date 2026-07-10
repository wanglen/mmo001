import { MAP_ID } from '/shared/worldMaps.js';
import { TILE } from '/shared/constants.js';
import { TILE_SIZE } from '../config.js';

function tileSeed(col, row) {
  return col * 928371 + row * 689287;
}

function drawCanopyShadow(ctx, x, y, w, h, col, row) {
  const seed = tileSeed(col, row);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  for (let i = 0; i < 3; i++) {
    const t = (seed + i * 131) % 997;
    const cx = x + w * (0.15 + (t % 70) / 100);
    const cy = y + h * (0.12 + ((t >> 3) % 76) / 100);
    const rx = w * (0.22 + (t % 20) / 100);
    const ry = h * (0.18 + ((t >> 5) % 18) / 100);
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawForestTree(ctx, x, y, w, h, col, row) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const seed = tileSeed(col, row);

  ctx.fillStyle = '#2a1810';
  ctx.fillRect(cx - w * 0.08, cy + h * 0.05, w * 0.16, h * 0.28);

  const layers = [
    { color: '#0a2810', scale: 0.46, offsetY: 0.02 },
    { color: '#143818', scale: 0.38, offsetY: -0.06 },
    { color: '#1e5020', scale: 0.28, offsetY: -0.14 },
  ];

  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    const jitter = ((seed + i * 17) % 5) - 2;
    ctx.fillStyle = layer.color;
    ctx.beginPath();
    ctx.arc(cx + jitter, cy + h * layer.offsetY, w * layer.scale, 0, Math.PI * 2);
    ctx.fill();
  }
}

export class ForestRenderer {
  draw(ctx, map, camera, tileSize, startCol, startRow, endCol, endRow) {
    if (map?.mapId !== MAP_ID.FOREST) return;

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const tile = map.tiles[row]?.[col];
        if (tile !== TILE.GRASS && tile !== TILE.TREE) continue;

        const worldX = col * TILE_SIZE;
        const worldY = row * TILE_SIZE;
        const screen = camera.worldToScreen(worldX, worldY);
        const w = tileSize.width;
        const h = tileSize.height;
        const { x, y } = screen;

        if (tile === TILE.GRASS) {
          ctx.fillStyle = 'rgba(10, 30, 12, 0.35)';
          ctx.fillRect(x, y, w, h);
          drawCanopyShadow(ctx, x, y, w, h, col, row);
        }

        if (tile === TILE.TREE) {
          drawForestTree(ctx, x, y, w, h, col, row);
        }
      }
    }
  }
}
