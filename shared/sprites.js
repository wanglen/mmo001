export const SPRITE_FRAME_SIZE = 16;

export const ANIMATION = {
  WALK_0: 0,
  WALK_1: 1,
  IDLE: 2,
  ATTACK: 3,
};

export const DIRECTION_ROW = {
  down: 0,
  up: 1,
  left: 2,
  right: 3,
};

export const SPRITE_COLUMNS = 4;
export const SPRITE_ROWS = 4;

/**
 * Resolve sprite sheet column/row for a character frame.
 * @param {{ moving?: boolean, attacking?: boolean }} state
 * @param {string} facing
 * @param {number} walkFrame - 0 or 1, toggles while walking
 */
export function resolveSpriteFrame(state, facing, walkFrame = 0) {
  const row = DIRECTION_ROW[facing] ?? DIRECTION_ROW.down;
  let col = ANIMATION.IDLE;

  if (state.attacking) {
    col = ANIMATION.ATTACK;
  } else if (state.moving) {
    col = walkFrame === 1 ? ANIMATION.WALK_1 : ANIMATION.WALK_0;
  }

  return { col, row, frameSize: SPRITE_FRAME_SIZE };
}

export function getSourceRect(col, row, frameSize = SPRITE_FRAME_SIZE) {
  return {
    sx: col * frameSize,
    sy: row * frameSize,
    sw: frameSize,
    sh: frameSize,
  };
}
