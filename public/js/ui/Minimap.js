import {
  MINIMAP_MAX_HEIGHT,
  MINIMAP_MAX_WIDTH,
  MINIMAP_MARGIN,
  minimapDimensions,
  minimapPlayerPoint,
  minimapScreenRect,
  minimapTileColor,
  minimapTileRect,
} from '/shared/minimap.js';
import { parseTileKey, tileKey } from '/shared/fog.js';
import { TILE_SIZE } from '../config.js';

const PANEL_BG = 'rgba(0, 0, 0, 0.62)';
const UNEXPLORED = '#141820';
const PORTAL_COLOR = '#7b68ee';
const PLAYER_COLOR = '#ffffff';
const PLAYER_OUTLINE = '#1a1a1a';

export class Minimap {
  draw(ctx, map, player, fogOfWar, canvasWidth) {
    if (!map?.tiles || !player) return;

    const revealed = fogOfWar?.revealed;
    const rect = minimapScreenRect(canvasWidth, map.width, map.height, MINIMAP_MARGIN);
    const { scale } = minimapDimensions(map.width, map.height, MINIMAP_MAX_WIDTH, MINIMAP_MAX_HEIGHT);

    ctx.fillStyle = PANEL_BG;
    ctx.fillRect(rect.x - 4, rect.y - 4, rect.width + 8, rect.height + 8);

    ctx.fillStyle = UNEXPLORED;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

    if (revealed?.size) {
      for (const key of revealed) {
        const { x, y } = parseTileKey(key);
        if (x < 0 || y < 0 || x >= map.width || y >= map.height) continue;

        const tile = map.tiles[y][x];
        const tileRect = minimapTileRect(
          map.width,
          map.height,
          x,
          y,
          rect.x,
          rect.y,
          MINIMAP_MAX_WIDTH,
          MINIMAP_MAX_HEIGHT
        );

        ctx.fillStyle = minimapTileColor(tile, map.mapId);
        ctx.fillRect(tileRect.x, tileRect.y, tileRect.width, tileRect.height);
      }
    } else {
      for (let row = 0; row < map.height; row++) {
        for (let col = 0; col < map.width; col++) {
          const tileRect = minimapTileRect(
            map.width,
            map.height,
            col,
            row,
            rect.x,
            rect.y,
            MINIMAP_MAX_WIDTH,
            MINIMAP_MAX_HEIGHT
          );
          ctx.fillStyle = minimapTileColor(map.tiles[row][col], map.mapId);
          ctx.fillRect(tileRect.x, tileRect.y, tileRect.width, tileRect.height);
        }
      }
    }

    for (const portal of map.portals ?? []) {
      const tile = portal.tile ?? { x: Math.floor(portal.x / TILE_SIZE), y: Math.floor(portal.y / TILE_SIZE) };
      if (revealed && !revealed.has(tileKey(tile.x, tile.y))) continue;

      const tileRect = minimapTileRect(
        map.width,
        map.height,
        tile.x,
        tile.y,
        rect.x,
        rect.y,
        MINIMAP_MAX_WIDTH,
        MINIMAP_MAX_HEIGHT
      );
      const cx = tileRect.x + tileRect.width / 2;
      const cy = tileRect.y + tileRect.height / 2;
      const r = Math.max(2, scale * 0.9);

      ctx.fillStyle = PORTAL_COLOR;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const point = minimapPlayerPoint(
      map.width,
      map.height,
      player.x,
      player.y,
      TILE_SIZE,
      rect.x,
      rect.y,
      MINIMAP_MAX_WIDTH,
      MINIMAP_MAX_HEIGHT
    );
    const dotR = Math.max(2.5, scale * 1.1);

    ctx.fillStyle = PLAYER_OUTLINE;
    ctx.beginPath();
    ctx.arc(point.x, point.y, dotR + 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = PLAYER_COLOR;
    ctx.beginPath();
    ctx.arc(point.x, point.y, dotR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.width - 1, rect.height - 1);
  }
}
