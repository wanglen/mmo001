import { generateDungeonLayout } from '../map/DungeonGenerator.js';
import { generateMap } from '../map/MapGenerator.js';
import { MAP_ID, WORLD_MAP_SIZES } from '../../shared/worldMaps.js';
import { createPortal } from '../../shared/portals.js';
import { buildTownNpcs } from './townNpcs.js';
import { npcToJSON } from '../../shared/npcs.js';
import {
  pickTownWildernessGate,
  ensurePortalReachable,
  placeWildernessDungeonGate,
  pickWildernessPortalGate,
} from './portalPlacement.js';

export function generateTownMap() {
  const { width, height } = WORLD_MAP_SIZES[MAP_ID.TOWN];
  const map = generateMap(width, height, { zoneLayout: 'town-only' });
  const npcs = buildTownNpcs(map);
  return { ...map, mapId: MAP_ID.TOWN, portals: [], npcs, npcsJson: npcs.map(npcToJSON) };
}

export function generateWildernessMap() {
  const { width, height } = WORLD_MAP_SIZES[MAP_ID.WILDERNESS];
  const map = generateMap(width, height, { zoneLayout: 'wilderness-only' });
  const dungeonGate = placeWildernessDungeonGate(map);
  return { ...map, mapId: MAP_ID.WILDERNESS, portals: [], dungeonGateTile: dungeonGate };
}

export function generateForestMap() {
  const { width, height } = WORLD_MAP_SIZES[MAP_ID.FOREST];
  const map = generateMap(width, height, { zoneLayout: 'forest-only' });
  return { ...map, mapId: MAP_ID.FOREST, portals: [] };
}

export function generateDesertMap() {
  const { width, height } = WORLD_MAP_SIZES[MAP_ID.DESERT];
  const map = generateMap(width, height, { zoneLayout: 'desert-only' });
  return { ...map, mapId: MAP_ID.DESERT, portals: [] };
}

export function generateDungeonMap() {
  const { width, height } = WORLD_MAP_SIZES[MAP_ID.DUNGEON];
  const map = generateDungeonLayout(width, height);
  return { ...map, mapId: MAP_ID.DUNGEON, portals: [] };
}

/** Gate tile placed by {@link placeWildernessDungeonGate} on the wilderness map. */
export function pickWildernessDungeonGate(map) {
  if (!map.dungeonGateTile) {
    throw new Error('Wilderness map is missing dungeonGateTile');
  }
  return map.dungeonGateTile;
}

export function attachWorldPortals(town, wilderness, dungeon, forest, desert) {
  const dungeonGate = pickWildernessDungeonGate(wilderness);
  const townGate = pickTownWildernessGate(town);

  const forestGate = pickWildernessPortalGate(wilderness, {
    excludeTiles: [dungeonGate],
    preferCorner: 'nw',
  });
  const desertGate = pickWildernessPortalGate(wilderness, {
    excludeTiles: [dungeonGate, forestGate],
    preferCorner: 'ne',
  });

  town.portals = [
    createPortal({
      id: 'town-wilderness',
      label: 'Wilderness',
      tile: townGate,
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
    createPortal({
      id: 'wilderness-forest',
      label: 'Dark Forest',
      tile: forestGate,
      targetMapId: MAP_ID.FOREST,
      targetTile: { ...forest.spawn },
    }),
    createPortal({
      id: 'wilderness-desert',
      label: 'Scorched Desert',
      tile: desertGate,
      targetMapId: MAP_ID.DESERT,
      targetTile: { ...desert.spawn },
    }),
  ];

  dungeon.portals = [
    createPortal({
      id: 'dungeon-wilderness',
      label: 'Wilderness',
      tile: ensurePortalReachable(dungeon, {
        x: dungeon.spawn.x,
        y: Math.min(dungeon.spawn.y + 1, dungeon.height - 2),
      }),
      targetMapId: MAP_ID.WILDERNESS,
      targetTile: dungeonGate,
    }),
  ];

  forest.portals = [
    createPortal({
      id: 'forest-wilderness',
      label: 'Wilderness',
      tile: ensurePortalReachable(forest, {
        x: forest.spawn.x,
        y: Math.min(forest.spawn.y + 2, forest.height - 2),
      }),
      targetMapId: MAP_ID.WILDERNESS,
      targetTile: forestGate,
    }),
  ];

  desert.portals = [
    createPortal({
      id: 'desert-wilderness',
      label: 'Wilderness',
      tile: ensurePortalReachable(desert, {
        x: desert.spawn.x,
        y: Math.min(desert.spawn.y + 2, desert.height - 2),
      }),
      targetMapId: MAP_ID.WILDERNESS,
      targetTile: desertGate,
    }),
  ];

  wilderness.dungeonGateTile = dungeonGate;
  wilderness.forestGateTile = forestGate;
  wilderness.desertGateTile = desertGate;
}
