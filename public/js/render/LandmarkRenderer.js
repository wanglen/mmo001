import { TILE } from '/shared/constants.js';
import { TILE_SIZE } from '../config.js';

const WALL_STONE = '#3a3340';
const WALL_HIGHLIGHT = '#5a5362';
const DOOR_FRAME = '#6b4a2a';
const DOOR_OPEN = '#120e18';
const CHEST_WOOD = '#8b5a2b';
const CHEST_GOLD = '#d4a017';

function drawWall(ctx, x, y, w, h) {
  ctx.fillStyle = WALL_STONE;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = WALL_HIGHLIGHT;
  const block = Math.max(2, w * 0.22);
  ctx.fillRect(x + block * 0.3, y + block * 0.3, block, block);
  ctx.fillRect(x + w - block * 1.3, y + block * 0.3, block, block);
  ctx.fillRect(x + block * 0.3, y + h - block * 1.3, block, block);
  ctx.fillRect(x + w - block * 1.3, y + h - block * 1.3, block, block);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fillRect(x, y + h - Math.max(2, h * 0.12), w, Math.max(2, h * 0.12));
}

function drawDoor(ctx, x, y, w, h) {
  const frame = Math.max(2, w * 0.14);
  ctx.fillStyle = DOOR_FRAME;
  ctx.fillRect(x + frame, y + h * 0.18, w - frame * 2, h * 0.72);
  ctx.fillRect(x + w * 0.22, y + h * 0.08, w * 0.12, h * 0.84);
  ctx.fillRect(x + w * 0.66, y + h * 0.08, w * 0.12, h * 0.84);
  ctx.fillStyle = DOOR_OPEN;
  ctx.fillRect(x + w * 0.34, y + h * 0.28, w * 0.32, h * 0.58);
}

function drawChest(ctx, x, y, w, h) {
  const cx = x + w * 0.5;
  const cy = y + h * 0.55;
  const bw = w * 0.52;
  const bh = h * 0.34;
  ctx.fillStyle = CHEST_WOOD;
  ctx.fillRect(cx - bw / 2, cy - bh / 2, bw, bh);
  ctx.fillStyle = CHEST_GOLD;
  ctx.fillRect(cx - bw * 0.12, cy - bh * 0.08, bw * 0.24, bh * 0.16);
  ctx.fillStyle = '#5c3d1e';
  ctx.fillRect(cx - bw / 2, cy - bh * 0.02, bw, Math.max(1, bh * 0.08));
  ctx.fillRect(cx - bw / 2, cy - bh / 2, Math.max(2, w * 0.06), bh);
  ctx.fillRect(cx + bw / 2 - Math.max(2, w * 0.06), cy - bh / 2, Math.max(2, w * 0.06), bh);
}

export class LandmarkRenderer {
  draw(ctx, map, camera, tileSize, startCol, startRow, endCol, endRow) {
    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const tile = map.tiles[row][col];
        if (tile !== TILE.WALL && tile !== TILE.DOOR && tile !== TILE.CHEST) continue;

        const screen = camera.worldToScreen(col * TILE_SIZE, row * TILE_SIZE);
        const w = tileSize.width;
        const h = tileSize.height;
        const { x, y } = screen;

        if (tile === TILE.WALL) drawWall(ctx, x, y, w, h);
        else if (tile === TILE.DOOR) drawDoor(ctx, x, y, w, h);
        else if (tile === TILE.CHEST) drawChest(ctx, x, y, w, h);
      }
    }
  }
}
