import { TILE } from '/shared/constants.js';
import { TILE_SIZE } from '../config.js';
import { TownRenderer } from './TownRenderer.js';
import { DungeonRenderer } from './DungeonRenderer.js';

const VOID_COLOR = '#0c0e14';
const GRASS = '#4a7c3f';
const GRASS_DARK = '#3a6634';
const CLIFF_DARK = '#2a2520';
const CLIFF_MID = '#4a4038';
const CLIFF_LIGHT = '#6b5d52';

const TILE_COLORS = {
  [TILE.GRASS]: GRASS,
  [TILE.WATER]: '#3a7bd5',
  [TILE.TREE]: '#2d5016',
  [TILE.ROCK]: CLIFF_MID,
};

function tileAt(map, col, row) {
  if (col < 0 || row < 0 || col >= map.width || row >= map.height) return TILE.ROCK;
  return map.tiles[row][col];
}

function isCliff(map, col, row) {
  return tileAt(map, col, row) === TILE.ROCK;
}

/** Avoid hairline gaps between tiles from fractional canvas coordinates. */
function fillTileRect(ctx, x, y, width, height, color) {
  const left = Math.floor(x);
  const top = Math.floor(y);
  const right = Math.ceil(x + width);
  const bottom = Math.ceil(y + height);
  ctx.fillStyle = color;
  ctx.fillRect(left, top, right - left + 1, bottom - top + 1);
}

function drawWorldVoid(ctx, map, camera, canvasWidth, canvasHeight) {
  const mapW = map.width * TILE_SIZE;
  const mapH = map.height * TILE_SIZE;
  const topLeft = camera.worldToScreen(0, 0);
  const bottomRight = camera.worldToScreen(mapW, mapH);
  const left = Math.floor(topLeft.x);
  const top = Math.floor(topLeft.y);
  const right = Math.ceil(bottomRight.x);
  const bottom = Math.ceil(bottomRight.y);

  ctx.fillStyle = VOID_COLOR;

  if (top > 0) ctx.fillRect(0, 0, canvasWidth, top);
  if (bottom < canvasHeight) ctx.fillRect(0, bottom, canvasWidth, canvasHeight - bottom);
  if (left > 0) ctx.fillRect(0, Math.max(0, top), left, Math.max(0, bottom - top));
  if (right < canvasWidth) ctx.fillRect(right, Math.max(0, top), canvasWidth - right, Math.max(0, bottom - top));
}

/** Worn grass strip when a walkable tile borders a cliff. */
function drawCliffAdjacentGrass(ctx, screen, tileSize, map, col, row) {
  const w = tileSize.width;
  const h = tileSize.height;
  const x = screen.x;
  const y = screen.y;
  const strip = Math.max(2, h * 0.22);

  const neighbors = [
    { dc: 0, dr: -1, draw: () => ctx.fillRect(x, y, w, strip) },
    { dc: 0, dr: 1, draw: () => ctx.fillRect(x, y + h - strip, w, strip) },
    { dc: -1, dr: 0, draw: () => ctx.fillRect(x, y, strip, h) },
    { dc: 1, dr: 0, draw: () => ctx.fillRect(x + w - strip, y, strip, h) },
  ];

  let nearCliff = false;
  ctx.fillStyle = GRASS_DARK;
  for (const n of neighbors) {
    if (isCliff(map, col + n.dc, row + n.dr)) {
      n.draw();
      nearCliff = true;
    }
  }

  if (nearCliff) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    if (isCliff(map, col, row - 1)) ctx.fillRect(x, y, w, strip * 0.6);
    if (isCliff(map, col, row + 1)) ctx.fillRect(x, y + h - strip * 0.6, w, strip * 0.6);
    if (isCliff(map, col - 1, row)) ctx.fillRect(x, y, strip * 0.6, h);
    if (isCliff(map, col + 1, row)) ctx.fillRect(x + w - strip * 0.6, y, strip * 0.6, h);
  }
}

function drawCliffStrata(ctx, x, y, w, h, seed, vertical) {
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
  ctx.lineWidth = Math.max(1, w * 0.035);
  const count = 2 + (seed % 2);

  for (let i = 0; i < count; i++) {
    const t = (i + 1) / (count + 1);
    ctx.beginPath();
    if (vertical) {
      const sx = x + w * (0.25 + t * 0.5) + ((seed + i) % 3) - 1;
      ctx.moveTo(sx, y + h * 0.15);
      ctx.lineTo(sx + ((seed + i) % 2 ? 1 : -1), y + h * 0.88);
    } else {
      const sy = y + h * (0.2 + t * 0.55);
      ctx.moveTo(x + w * 0.12, sy);
      ctx.lineTo(x + w * 0.88, sy + ((seed + i) % 2 ? 1 : -1));
    }
    ctx.stroke();
  }
}

/** Directional cliff face: grass rim inward, stone and void outward. */
function drawCliffTile(ctx, screen, tileSize, map, col, row) {
  const w = tileSize.width;
  const h = tileSize.height;
  const x = screen.x;
  const y = screen.y;
  const seed = col * 19 + row * 37;
  const rim = Math.max(3, Math.min(w, h) * 0.3);
  const onNorth = row === 0;
  const onSouth = row === map.height - 1;
  const onWest = col === 0;
  const onEast = col === map.width - 1;

  fillTileRect(ctx, x, y, w, h, CLIFF_MID);

  if (onNorth && onWest) {
    const grad = ctx.createRadialGradient(x, y, 0, x, y, Math.max(w, h));
    grad.addColorStop(0, VOID_COLOR);
    grad.addColorStop(0.55, CLIFF_DARK);
    grad.addColorStop(1, CLIFF_MID);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    fillTileRect(ctx, x + w - rim, y + h - rim, rim, rim, GRASS);
  } else if (onNorth && onEast) {
    const grad = ctx.createRadialGradient(x + w, y, 0, x + w, y, Math.max(w, h));
    grad.addColorStop(0, VOID_COLOR);
    grad.addColorStop(0.55, CLIFF_DARK);
    grad.addColorStop(1, CLIFF_MID);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    fillTileRect(ctx, x, y + h - rim, rim, rim, GRASS);
  } else if (onSouth && onWest) {
    const grad = ctx.createRadialGradient(x, y + h, 0, x, y + h, Math.max(w, h));
    grad.addColorStop(0, VOID_COLOR);
    grad.addColorStop(0.55, CLIFF_DARK);
    grad.addColorStop(1, CLIFF_MID);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    fillTileRect(ctx, x + w - rim, y, rim, rim, GRASS);
  } else if (onSouth && onEast) {
    const grad = ctx.createRadialGradient(x + w, y + h, 0, x + w, y + h, Math.max(w, h));
    grad.addColorStop(0, VOID_COLOR);
    grad.addColorStop(0.55, CLIFF_DARK);
    grad.addColorStop(1, CLIFF_MID);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    fillTileRect(ctx, x, y, rim, rim, GRASS);
  } else if (onNorth) {
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, VOID_COLOR);
    grad.addColorStop(0.4, CLIFF_DARK);
    grad.addColorStop(0.85, CLIFF_MID);
    grad.addColorStop(1, 'rgba(74, 64, 56, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    fillTileRect(ctx, x, y + h - rim, w, rim, GRASS);
  } else if (onSouth) {
    const grad = ctx.createLinearGradient(x, y + h, x, y);
    grad.addColorStop(0, VOID_COLOR);
    grad.addColorStop(0.4, CLIFF_DARK);
    grad.addColorStop(0.85, CLIFF_MID);
    grad.addColorStop(1, 'rgba(74, 64, 56, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    fillTileRect(ctx, x, y, w, rim, GRASS);
  } else if (onWest) {
    const grad = ctx.createLinearGradient(x, y, x + w, y);
    grad.addColorStop(0, VOID_COLOR);
    grad.addColorStop(0.4, CLIFF_DARK);
    grad.addColorStop(0.85, CLIFF_MID);
    grad.addColorStop(1, 'rgba(74, 64, 56, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    fillTileRect(ctx, x + w - rim, y, rim, h, GRASS);
  } else if (onEast) {
    const grad = ctx.createLinearGradient(x + w, y, x, y);
    grad.addColorStop(0, VOID_COLOR);
    grad.addColorStop(0.4, CLIFF_DARK);
    grad.addColorStop(0.85, CLIFF_MID);
    grad.addColorStop(1, 'rgba(74, 64, 56, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    fillTileRect(ctx, x, y, rim, h, GRASS);
  }

  ctx.fillStyle = CLIFF_LIGHT;
  if (onSouth) ctx.fillRect(x + w * 0.1, y + h - Math.max(2, h * 0.07), w * 0.8, Math.max(2, h * 0.05));
  if (onEast) ctx.fillRect(x + w - Math.max(2, w * 0.07), y + h * 0.12, Math.max(2, w * 0.05), h * 0.76);

  drawCliffStrata(ctx, x, y, w, h, seed, onNorth || onSouth);
}

export class MapRenderer {
  constructor() {
    this.townRenderer = new TownRenderer();
    this.dungeonRenderer = new DungeonRenderer();
  }

  draw(ctx, map, camera, canvasWidth, canvasHeight) {
    drawWorldVoid(ctx, map, camera, canvasWidth, canvasHeight);

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

        fillTileRect(ctx, screen.x, screen.y, tileSize.width, tileSize.height, TILE_COLORS[tile] || '#333');

        if (tile === TILE.GRASS) {
          drawCliffAdjacentGrass(ctx, screen, tileSize, map, col, row);
        }

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

        if (tile === TILE.ROCK) {
          drawCliffTile(ctx, screen, tileSize, map, col, row);
        }
      }
    }

    this.townRenderer.draw(ctx, map, camera, tileSize, startCol, startRow, endCol, endRow);
    this.dungeonRenderer.draw(ctx, map, camera, tileSize, startCol, startRow, endCol, endRow);
  }
}
