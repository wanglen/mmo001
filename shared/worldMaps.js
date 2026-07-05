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
