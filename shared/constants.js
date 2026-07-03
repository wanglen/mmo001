export const TILE = {
  GRASS: 0,
  WATER: 1,
  TREE: 2,
};

export const TILE_WALKABLE = {
  [TILE.GRASS]: true,
  [TILE.WATER]: false,
  [TILE.TREE]: false,
};

export const CHARACTER_CLASSES = {
  warrior: { label: 'Warrior', color: '#c0392b' },
  mage: { label: 'Mage', color: '#2980b9' },
  ranger: { label: 'Ranger', color: '#27ae60' },
};

export const DIRECTIONS = ['up', 'down', 'left', 'right'];

export const MAP_WIDTH = 40;
export const MAP_HEIGHT = 30;
export const TILE_SIZE = 32;
export const PLAYER_SIZE = 16;

export const MOVE_SPEED = 3;
