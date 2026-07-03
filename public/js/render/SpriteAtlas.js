import { CHARACTER_CLASSES } from '/shared/constants.js';
import {
  SPRITE_FRAME_SIZE,
  SPRITE_COLUMNS,
  SPRITE_ROWS,
  DIRECTION_ROW,
  ANIMATION,
} from '/shared/sprites.js';

const DIRECTIONS = Object.keys(DIRECTION_ROW);

function drawCharacterFrame(ctx, ox, oy, color, accent, direction, animCol) {
  const body = color;
  const dark = shade(color, -30);
  const light = shade(color, 40);
  const skin = '#f5cba7';

  // Clear frame
  ctx.clearRect(ox, oy, SPRITE_FRAME_SIZE, SPRITE_FRAME_SIZE);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(ox + 3, oy + 13, 10, 2);

  const bob = animCol === ANIMATION.WALK_1 ? 1 : 0;
  const attackLunge =
    animCol === ANIMATION.ATTACK
      ? direction === 'left'
        ? -1
        : direction === 'right'
          ? 1
          : 0
      : 0;

  const px = ox + 4 + attackLunge;
  const py = oy + 4 + bob;

  // Legs (walk animation alternates)
  ctx.fillStyle = dark;
  if (animCol === ANIMATION.WALK_0) {
    ctx.fillRect(px + 2, py + 8, 2, 4);
    ctx.fillRect(px + 6, py + 7, 2, 5);
  } else if (animCol === ANIMATION.WALK_1) {
    ctx.fillRect(px + 2, py + 7, 2, 5);
    ctx.fillRect(px + 6, py + 8, 2, 4);
  } else {
    ctx.fillRect(px + 2, py + 8, 2, 4);
    ctx.fillRect(px + 6, py + 8, 2, 4);
  }

  // Body
  ctx.fillStyle = body;
  ctx.fillRect(px + 1, py + 3, 8, 6);
  ctx.fillStyle = light;
  ctx.fillRect(px + 2, py + 4, 2, 4);

  // Head
  ctx.fillStyle = skin;
  ctx.fillRect(px + 2, py + 1, 6, 4);
  ctx.fillStyle = '#2c1810';
  ctx.fillRect(px + 3, py + 2, 1, 1);
  ctx.fillRect(px + 6, py + 2, 1, 1);

  // Direction accent (weapon / staff / bow hint)
  ctx.fillStyle = accent;
  switch (direction) {
    case 'down':
      ctx.fillRect(px + 3, py + 9, 4, 2);
      break;
    case 'up':
      ctx.fillRect(px + 3, py, 4, 2);
      break;
    case 'left':
      ctx.fillRect(px - 1, py + 4, 2, 4);
      if (animCol === ANIMATION.ATTACK) ctx.fillRect(px - 3, py + 3, 2, 6);
      break;
    case 'right':
      ctx.fillRect(px + 9, py + 4, 2, 4);
      if (animCol === ANIMATION.ATTACK) ctx.fillRect(px + 11, py + 3, 2, 6);
      break;
  }
}

function shade(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

const CLASS_ACCENTS = {
  warrior: '#bdc3c7',
  mage: '#9b59b6',
  ranger: '#d4ac0d',
};

/**
 * Builds a programmatic sprite sheet canvas for one character class.
 */
export function buildClassAtlas(characterClass) {
  const cls = CHARACTER_CLASSES[characterClass];
  const canvas = document.createElement('canvas');
  canvas.width = SPRITE_FRAME_SIZE * SPRITE_COLUMNS;
  canvas.height = SPRITE_FRAME_SIZE * SPRITE_ROWS;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const color = cls?.color || '#888';
  const accent = CLASS_ACCENTS[characterClass] || '#fff';

  for (const direction of DIRECTIONS) {
    const row = DIRECTION_ROW[direction];
    for (let col = 0; col < SPRITE_COLUMNS; col++) {
      drawCharacterFrame(
        ctx,
        col * SPRITE_FRAME_SIZE,
        row * SPRITE_FRAME_SIZE,
        color,
        accent,
        direction,
        col
      );
    }
  }

  return canvas;
}

export class SpriteAtlas {
  constructor() {
    this.atlases = new Map();
  }

  get(characterClass) {
    if (!this.atlases.has(characterClass)) {
      this.atlases.set(characterClass, buildClassAtlas(characterClass));
    }
    return this.atlases.get(characterClass);
  }
}
