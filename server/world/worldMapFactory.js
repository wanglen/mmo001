import { generateMap, pickDungeonCenter } from '../map/MapGenerator.js';
import { MAP_ID, WORLD_MAP_SIZES } from '../../shared/worldMaps.js';
import { createPortal } from '../../shared/portals.js';
import { TOWN_RADIUS_TILES } from '../../shared/zones.js';
import { TILE_WALKABLE } from '../../shared/constants.js';
import { buildTownNpcs } from './townNpcs.js';
import { npcToJSON } from '../../shared/npcs.js';

export function generateTownMap() {
  const { width, height } = WORLD_MAP_SIZES[MAP_ID.TOWN];
  const map = generateMap(width, height, { zoneLayout: 'town-only' });
  const npcs = buildTownNpcs(map);
  return { ...map, mapId: MAP_ID.TOWN, portals: [], npcs, npcsJson: npcs.map(npcToJSON) };
}

export function generateWildernessMap() {
  const { width, height } = WORLD_MAP_SIZES[MAP_ID.WILDERNESS];
  const map = generateMap(width, height, { zoneLayout: 'wilderness-only' });
  return { ...map, mapId: MAP_ID.WILDERNESS, portals: [] };
}

export function generateDungeonMap() {
  const { width, height } = WORLD_MAP_SIZES[MAP_ID.DUNGEON];
  const map = generateMap(width, height, { zoneLayout: 'dungeon-only' });
  return { ...map, mapId: MAP_ID.DUNGEON, portals: [] };
}

/** Walkable tile far from spawn to place the wilderness → dungeon portal. */
export function pickWildernessDungeonGate(map) {
  const center = pickDungeonCenter(map.tiles, map.width, map.height, map.spawn, null);
  if (center) return center;

  for (let y = 1; y < map.height - 1; y++) {
    for (let x = 1; x < map.width - 1; x++) {
      if (TILE_WALKABLE[map.tiles[y][x]]) return { x, y };
    }
  }
  return { x: map.spawn.x + 5, y: map.spawn.y + 5 };
}

export function attachWorldPortals(town, wilderness, dungeon) {
  const dungeonGate = pickWildernessDungeonGate(wilderness);

  town.portals = [
    createPortal({
      id: 'town-wilderness',
      label: 'Wilderness',
      tile: { x: town.spawn.x, y: town.spawn.y + TOWN_RADIUS_TILES + 1 },
      targetMapId: MAP_ID.WILDERNESS,
      targetTile: { ...wilderness.spawn },
    }),
  ];

  wilderness.portals = [
    createPortal({
      id: 'wilderness-town',
      label: 'Town',
      tile: { x: wilderness.spawn.x + 2, y: wilderness.spawn.y },
      targetMapId: MAP_ID.TOWN,
      targetTile: { ...town.spawn },
    }),
    createPortal({
      id: 'wilderness-dungeon',
      label: 'Dungeon',
      tile: dungeonGate,
      targetMapId: MAP_ID.DUNGEON,
      targetTile: { ...dungeon.spawn },
    }),
  ];

  dungeon.portals = [
    createPortal({
      id: 'dungeon-wilderness',
      label: 'Wilderness',
      tile: { x: dungeon.spawn.x, y: dungeon.spawn.y + 1 },
      targetMapId: MAP_ID.WILDERNESS,
      targetTile: dungeonGate,
    }),
  ];

  wilderness.dungeonGateTile = dungeonGate;
}
