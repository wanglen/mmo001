/** Instanced world map identifiers. */
export const MAP_ID = {
  TOWN: 'town',
  WILDERNESS: 'wilderness',
  DUNGEON: 'dungeon',
};

export const WORLD_MAP_IDS = [MAP_ID.TOWN, MAP_ID.WILDERNESS, MAP_ID.DUNGEON];

export const WORLD_MAP_SIZES = {
  [MAP_ID.TOWN]: { width: 48, height: 36 },
  [MAP_ID.WILDERNESS]: { width: 120, height: 90 },
  [MAP_ID.DUNGEON]: { width: 48, height: 40 },
};

/** Default map for new characters and respawn. */
export const DEFAULT_MAP_ID = MAP_ID.TOWN;

/** Human-readable zone names for UI (loading screen, minimap hints). */
export const MAP_LABELS = {
  [MAP_ID.TOWN]: 'Town',
  [MAP_ID.WILDERNESS]: 'Wilderness',
  [MAP_ID.DUNGEON]: 'Dungeon',
};

/**
 * @param {string | null | undefined} mapId
 * @returns {string}
 */
export function getMapDisplayName(mapId) {
  if (!mapId) return 'Unknown Area';
  return MAP_LABELS[mapId] ?? 'Unknown Area';
}
