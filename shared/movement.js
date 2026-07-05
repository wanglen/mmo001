import { MOVE_SPEED } from './constants.js';

export const CARDINAL_DIRECTIONS = ['up', 'down', 'left', 'right'];

export const DIRECTIONS = [
  'up',
  'down',
  'left',
  'right',
  'up-left',
  'up-right',
  'down-left',
  'down-right',
];

const DIAGONAL_SPEED = MOVE_SPEED / Math.SQRT2;

/** Pixel delta per move tick for each direction (diagonals normalized). */
export const DIRECTION_DELTA = {
  up: { x: 0, y: -MOVE_SPEED },
  down: { x: 0, y: MOVE_SPEED },
  left: { x: -MOVE_SPEED, y: 0 },
  right: { x: MOVE_SPEED, y: 0 },
  'up-left': { x: -DIAGONAL_SPEED, y: -DIAGONAL_SPEED },
  'up-right': { x: DIAGONAL_SPEED, y: -DIAGONAL_SPEED },
  'down-left': { x: -DIAGONAL_SPEED, y: DIAGONAL_SPEED },
  'down-right': { x: DIAGONAL_SPEED, y: DIAGONAL_SPEED },
};

const EIGHT_WAY = [
  'right',
  'down-right',
  'down',
  'down-left',
  'left',
  'up-left',
  'up',
  'up-right',
];

export function isValidDirection(direction) {
  return direction in DIRECTION_DELTA;
}

/** Snap a world delta to the nearest 8-way movement direction. */
export function directionFromDelta8(dx, dy) {
  if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return null;

  const angle = Math.atan2(dy, dx);
  const sector = Math.round(angle / (Math.PI / 4));
  const index = ((sector % 8) + 8) % 8;
  return EIGHT_WAY[index];
}

/** Map 8-way movement to 4-way sprite facing (vertical component preferred). */
export function toCardinalDirection(direction) {
  if (!direction) return 'down';
  if (!direction.includes('-')) return direction;
  return direction.split('-')[0];
}

/** Keyboard chord to 8-way direction, or null. */
export function directionFromKeys({ up, down, left, right }) {
  if (up && left) return 'up-left';
  if (up && right) return 'up-right';
  if (down && left) return 'down-left';
  if (down && right) return 'down-right';
  if (up) return 'up';
  if (down) return 'down';
  if (left) return 'left';
  if (right) return 'right';
  return null;
}
