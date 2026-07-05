import { isTileInZone, ZONE_ID } from '/shared/zones.js';
import { TILE_SIZE } from '../config.js';

const STONE = '#4a4450';
const STONE_DARK = '#2a2430';
const STONE_LIGHT = '#6a6470';
const GROUND = 'rgba(60, 48, 72, 0.28)';

function isDungeonZone(zone) {
  return zone?.id === ZONE_ID.DUNGEON;
}

function outwardSides(zone, col, row) {
  const inZone = (c, r) => isTileInZone(zone, c, r);
  return {
    n: inZone(col, row) && !inZone(col, row - 1),
    s: inZone(col, row) && !inZone(col, row + 1),
    w: inZone(col, row) && !inZone(col - 1, row),
    e: inZone(col, row) && !inZone(col + 1, row),
  };
}

function drawDungeonGround(ctx, x, y, w, h) {
  ctx.fillStyle = GROUND;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(30, 24, 38, 0.18)';
  ctx.fillRect(x + w * 0.15, y + h * 0.2, w * 0.22, h * 0.18);
  ctx.fillRect(x + w * 0.55, y + h * 0.55, w * 0.2, h * 0.16);
}

function drawStoneBorder(ctx, x, y, w, h, sides) {
  const block = Math.max(2, w * 0.18);
  ctx.fillStyle = STONE;
  if (sides.n) ctx.fillRect(x, y, w, block);
  if (sides.s) ctx.fillRect(x, y + h - block, w, block);
  if (sides.w) ctx.fillRect(x, y, block, h);
  if (sides.e) ctx.fillRect(x + w - block, y, block, h);
}

function drawArch(ctx, x, y, w, h) {
  ctx.fillStyle = STONE_DARK;
  ctx.fillRect(x + w * 0.28, y + h * 0.35, w * 0.44, h * 0.55);
  ctx.fillStyle = STONE;
  ctx.fillRect(x + w * 0.22, y + h * 0.22, w * 0.12, h * 0.68);
  ctx.fillRect(x + w * 0.66, y + h * 0.22, w * 0.12, h * 0.68);
  ctx.beginPath();
  ctx.arc(x + w * 0.5, y + h * 0.28, w * 0.22, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#120e18';
  ctx.fillRect(x + w * 0.36, y + h * 0.42, w * 0.28, h * 0.48);
}

function drawZoneSign(ctx, x, y, w, h, label) {
  ctx.fillStyle = STONE_DARK;
  ctx.fillRect(x + w * 0.38, y + h * 0.28, w * 0.1, h * 0.62);
  ctx.fillStyle = STONE_LIGHT;
  ctx.fillRect(x + w * 0.1, y + h * 0.2, w * 0.8, h * 0.2);
  const fontSize = Math.max(7, Math.min(11, w * 0.26));
  ctx.font = `700 ${fontSize}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#e8dff5';
  ctx.fillText(label, x + w / 2, y + h * 0.3);
}

function decorationAt(zone, col, row) {
  const { x: cx, y: cy } = zone.center;
  if (col === cx && row === cy) return 'arch';
  if (col === cx && row === cy + zone.radius) return 'sign';
  return null;
}

export class DungeonRenderer {
  draw(ctx, map, camera, tileSize, startCol, startRow, endCol, endRow) {
    for (const zone of map.zones ?? []) {
      if (!isDungeonZone(zone)) continue;

      for (let row = startRow; row < endRow; row++) {
        for (let col = startCol; col < endCol; col++) {
          if (!isTileInZone(zone, col, row)) continue;

          const worldX = col * TILE_SIZE;
          const worldY = row * TILE_SIZE;
          const screen = camera.worldToScreen(worldX, worldY);
          const w = tileSize.width;
          const h = tileSize.height;
          const { x, y } = screen;

          const sides = outwardSides(zone, col, row);
          const onEdge = sides.n || sides.s || sides.w || sides.e;
          const deco = decorationAt(zone, col, row);

          if (!onEdge && deco !== 'arch') drawDungeonGround(ctx, x, y, w, h);
          if (onEdge && deco !== 'sign') drawStoneBorder(ctx, x, y, w, h, sides);
          if (deco === 'arch') drawArch(ctx, x, y, w, h);
          if (deco === 'sign') {
            drawStoneBorder(ctx, x, y, w, h, sides);
            drawZoneSign(ctx, x, y, w, h, zone.label ?? 'Dungeon');
          }
        }
      }
    }
  }
}
