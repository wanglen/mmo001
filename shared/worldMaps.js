/** Instanced world map identifiers. */
export const MAP_ID = {
  TOWN: 'town',
  WILDERNESS: 'wilderness',
  DUNGEON: 'dungeon',
  FOREST: 'forest',
  DESERT: 'desert',
};

export const WORLD_MAP_IDS = [
  MAP_ID.TOWN,
  MAP_ID.WILDERNESS,
  MAP_ID.DUNGEON,
  MAP_ID.FOREST,
  MAP_ID.DESERT,
];

export const WORLD_MAP_SIZES = {
  [MAP_ID.TOWN]: { width: 48, height: 36 },
  [MAP_ID.WILDERNESS]: { width: 120, height: 90 },
  [MAP_ID.DUNGEON]: { width: 48, height: 40 },
  [MAP_ID.FOREST]: { width: 90, height: 70 },
  [MAP_ID.DESERT]: { width: 90, height: 70 },
};

/** Default map for new characters and respawn. */
export const DEFAULT_MAP_ID = MAP_ID.TOWN;

/** Human-readable zone names for UI (loading screen, minimap hints). */
export const MAP_LABELS = {
  [MAP_ID.TOWN]: 'Town',
  [MAP_ID.WILDERNESS]: 'Wilderness',
  [MAP_ID.DUNGEON]: 'Dungeon',
  [MAP_ID.FOREST]: 'Dark Forest',
  [MAP_ID.DESERT]: 'Scorched Desert',
};

/**
 * @param {string | null | undefined} mapId
 * @returns {string}
 */
export function getMapDisplayName(mapId) {
  if (!mapId) return 'Unknown Area';
  return MAP_LABELS[mapId] ?? 'Unknown Area';
}

/** HUD/minimap biome styling for full-map instanced zones (forest, desert). */
export const MAP_BIOME_META = {
  [MAP_ID.FOREST]: { label: MAP_LABELS[MAP_ID.FOREST], color: '#4a9a52' },
  [MAP_ID.DESERT]: { label: MAP_LABELS[MAP_ID.DESERT], color: '#e8c060' },
};

/**
 * @param {string | null | undefined} mapId
 */
export function getMapBiomeMeta(mapId) {
  if (!mapId) return null;
  return MAP_BIOME_META[mapId] ?? null;
}
