import { generateDungeonLayout } from '../map/DungeonGenerator.js';
import { generateMap } from '../map/MapGenerator.js';
import { MAP_ID, WORLD_MAP_SIZES } from '../../shared/worldMaps.js';
import { createPortal } from '../../shared/portals.js';
import { buildTownNpcs } from './townNpcs.js';
import { npcToJSON } from '../../shared/npcs.js';
import { pickTownWildernessGate, ensurePortalReachable, placeWildernessDungeonGate } from './portalPlacement.js';

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

export function attachWorldPortals(town, wilderness, dungeon) {
  const dungeonGate = pickWildernessDungeonGate(wilderness);
  const townGate = pickTownWildernessGate(town);

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

  wilderness.dungeonGateTile = dungeonGate;
}
