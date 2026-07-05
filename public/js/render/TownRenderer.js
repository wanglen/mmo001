import { isTileInZone, ZONE_ID } from '/shared/zones.js';
import { TILE_SIZE } from '../config.js';

const WOOD = '#7a5230';
const WOOD_DARK = '#4a3018';
const WOOD_LIGHT = '#9a7048';
const COBBLE = '#6a6a72';
const COBBLE_DARK = '#4a4a52';
const PATH = '#8a7a5a';
const GRASS_WARM = 'rgba(90, 138, 74, 0.35)';

function isTownZone(zone) {
  return zone?.id === ZONE_ID.TOWN && zone.safe;
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

function drawTownGround(ctx, x, y, w, h, isPath) {
  if (isPath) {
    ctx.fillStyle = PATH;
    ctx.fillRect(x + w * 0.08, y + h * 0.08, w * 0.84, h * 0.84);
    ctx.fillStyle = COBBLE_DARK;
    ctx.fillRect(x + w * 0.2, y + h * 0.25, w * 0.18, h * 0.18);
    ctx.fillRect(x + w * 0.55, y + h * 0.55, w * 0.2, h * 0.16);
  } else {
    ctx.fillStyle = GRASS_WARM;
    ctx.fillRect(x, y, w, h);
  }
}

function drawFence(ctx, x, y, w, h, sides) {
  const post = Math.max(2, w * 0.14);
  const rail = Math.max(2, h * 0.07);
  const gap = h * 0.22;

  const drawPost = (px, py) => {
    ctx.fillStyle = WOOD_DARK;
    ctx.fillRect(px, py, post, h);
    ctx.fillStyle = WOOD_LIGHT;
    ctx.fillRect(px + 1, py + 1, Math.max(1, post - 2), Math.max(1, h * 0.12));
  };

  const drawHorizRails = (ry, rw, rx) => {
    ctx.fillStyle = WOOD;
    ctx.fillRect(rx, ry, rw, rail);
    ctx.fillRect(rx, ry + gap, rw, rail);
  };

  const drawVertRails = (rx, rh, ry) => {
    ctx.fillStyle = WOOD;
    ctx.fillRect(rx, ry, rail, rh);
    ctx.fillRect(rx + gap, ry, rail, rh);
  };

  if (sides.n) drawHorizRails(y, w, x);
  if (sides.s) drawHorizRails(y + h - rail, w, x);
  if (sides.w) drawVertRails(x, h, y);
  if (sides.e) drawVertRails(x + w - rail, h, y);

  if (sides.n && sides.w) drawPost(x, y);
  if (sides.n && sides.e) drawPost(x + w - post, y);
  if (sides.s && sides.w) drawPost(x, y + h - post);
  if (sides.s && sides.e) drawPost(x + w - post, y + h - post);

  if (sides.n && !sides.w && !sides.e) drawPost(x + w / 2 - post / 2, y);
  if (sides.s && !sides.w && !sides.e) drawPost(x + w / 2 - post / 2, y + h - post);
  if (sides.w && !sides.n && !sides.s) drawPost(x, y + h / 2 - post / 2);
  if (sides.e && !sides.n && !sides.s) drawPost(x + w - post, y + h / 2 - post / 2);
}

function drawHouse(ctx, x, y, w, h) {
  ctx.fillStyle = COBBLE;
  ctx.fillRect(x + w * 0.12, y + h * 0.58, w * 0.76, h * 0.34);

  ctx.fillStyle = '#c9b896';
  ctx.fillRect(x + w * 0.18, y + h * 0.38, w * 0.64, h * 0.32);

  ctx.fillStyle = '#7a3333';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.12, y + h * 0.38);
  ctx.lineTo(x + w * 0.5, y + h * 0.08);
  ctx.lineTo(x + w * 0.88, y + h * 0.38);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = WOOD_DARK;
  ctx.fillRect(x + w * 0.42, y + h * 0.58, w * 0.16, h * 0.24);

  ctx.fillStyle = '#a8d8f0';
  ctx.fillRect(x + w * 0.26, y + h * 0.46, w * 0.14, h * 0.12);
  ctx.fillRect(x + w * 0.6, y + h * 0.46, w * 0.14, h * 0.12);

  ctx.fillStyle = WOOD_DARK;
  ctx.fillRect(x + w * 0.48, y + h * 0.12, w * 0.04, h * 0.08);
}

function drawWell(ctx, x, y, w, h) {
  ctx.fillStyle = COBBLE;
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h * 0.62, w * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3a5a78';
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h * 0.62, w * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = WOOD;
  ctx.fillRect(x + w * 0.22, y + h * 0.18, w * 0.08, h * 0.5);
  ctx.fillRect(x + w * 0.7, y + h * 0.18, w * 0.08, h * 0.5);
  ctx.fillRect(x + w * 0.22, y + h * 0.16, w * 0.56, h * 0.06);
}

function drawTownSign(ctx, x, y, w, h, label) {
  drawPost(ctx, x + w * 0.38, y + h * 0.25, w * 0.12, h * 0.65);
  ctx.fillStyle = WOOD;
  ctx.fillRect(x + w * 0.12, y + h * 0.18, w * 0.76, h * 0.22);
  ctx.fillStyle = '#e8dcc8';
  ctx.fillRect(x + w * 0.16, y + h * 0.21, w * 0.68, h * 0.16);

  const fontSize = Math.max(7, Math.min(11, w * 0.28));
  ctx.font = `700 ${fontSize}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = WOOD_DARK;
  ctx.fillText(label, x + w / 2, y + h * 0.29);
}

function drawPost(ctx, px, py, pw, ph) {
  ctx.fillStyle = WOOD_DARK;
  ctx.fillRect(px, py, pw, ph);
}

function decorationAt(zone, col, row) {
  const { x: cx, y: cy } = zone.center;
  if (col === cx && row === cy) return 'house';
  if (col === cx + 2 && row === cy) return 'well';
  if (col === cx && row === cy + zone.radius) return 'sign';
  return null;
}

function isPathTile(zone, col, row) {
  const { x: cx, y: cy } = zone.center;
  if (col === cx && row >= cy && row <= cy + zone.radius) return true;
  if (row === cy && Math.abs(col - cx) <= 1) return true;
  return col === cx && row === cy;
}

export class TownRenderer {
  draw(ctx, map, camera, tileSize, startCol, startRow, endCol, endRow) {
    for (const zone of map.zones ?? []) {
      if (!isTownZone(zone)) continue;

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

          if (!onEdge && deco !== 'house') {
            drawTownGround(ctx, x, y, w, h, isPathTile(zone, col, row));
          }

          if (onEdge && deco !== 'sign') {
            drawFence(ctx, x, y, w, h, sides);
          }

          if (deco === 'house') drawHouse(ctx, x, y, w, h);
          if (deco === 'well') drawWell(ctx, x, y, w, h);
          if (deco === 'sign') {
            drawFence(ctx, x, y, w, h, sides);
            drawTownSign(ctx, x, y, w, h, zone.label ?? 'Town');
          }
        }
      }
    }
  }
}
