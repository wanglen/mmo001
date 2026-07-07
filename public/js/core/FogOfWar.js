import {
  FOG_REVEAL_RADIUS_TILES,
  revealTilesInRadius,
  revealTownZones,
} from '/shared/fog.js';
import { TILE_SIZE } from '../config.js';

export class FogOfWar {
  constructor() {
    this.revealed = new Set();
    this.mapKey = null;
  }

  resetForMap(map) {
    if (!map) return;
    const key = map.mapId ?? `${map.width}x${map.height}`;
    if (this.mapKey === key) return;
    this.mapKey = key;
    this.revealed = new Set();
    revealTownZones(this.revealed, map);
  }

  update(map, playerX, playerY) {
    if (!map || playerX == null || playerY == null) return;
    this.resetForMap(map);
    const tileX = Math.floor(playerX / TILE_SIZE);
    const tileY = Math.floor(playerY / TILE_SIZE);
    revealTilesInRadius(this.revealed, tileX, tileY, FOG_REVEAL_RADIUS_TILES);
  }
}
