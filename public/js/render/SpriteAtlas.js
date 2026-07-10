import { CHARACTER_CLASSES } from '/shared/constants.js';
import {
  SPRITE_FRAME_SIZE,
  SPRITE_COLUMNS,
  SPRITE_ROWS,
  DIRECTION_ROW,
  ANIMATION,
} from '/shared/sprites.js';

const DIRECTIONS = Object.keys(DIRECTION_ROW);

function shade(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function drawLegs(ctx, px, py, dark, animCol) {
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
}

function drawHead(ctx, px, py, skin, hair) {
  ctx.fillStyle = skin;
  ctx.fillRect(px + 2, py + 1, 6, 4);
  ctx.fillStyle = hair;
  ctx.fillRect(px + 2, py, 6, 2);
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(px + 3, py + 2, 1, 1);
  ctx.fillRect(px + 6, py + 2, 1, 1);
}

function drawWarriorFrame(ctx, px, py, body, dark, light, accent, direction, animCol) {
  ctx.fillStyle = '#7f8c8d';
  ctx.fillRect(px + 2, py, 6, 2);
  ctx.fillRect(px + 1, py + 2, 8, 2);

  ctx.fillStyle = body;
  ctx.fillRect(px + 1, py + 3, 8, 6);
  ctx.fillStyle = light;
  ctx.fillRect(px + 2, py + 4, 2, 4);
  ctx.fillStyle = dark;
  ctx.fillRect(px + 7, py + 4, 1, 4);

  ctx.fillStyle = accent;
  if (direction === 'left') {
    ctx.fillRect(px - 1, py + 3, 2, 5);
    if (animCol === ANIMATION.ATTACK) {
      ctx.fillRect(px - 4, py + 2, 2, 7);
      ctx.fillStyle = light;
      ctx.fillRect(px - 4, py + 2, 1, 7);
    }
  } else if (direction === 'right') {
    ctx.fillRect(px + 9, py + 3, 2, 5);
    if (animCol === ANIMATION.ATTACK) {
      ctx.fillRect(px + 12, py + 2, 2, 7);
      ctx.fillStyle = light;
      ctx.fillRect(px + 13, py + 2, 1, 7);
    }
  } else if (direction === 'down') {
    ctx.fillRect(px + 3, py + 8, 4, 2);
  } else {
    ctx.fillRect(px + 3, py - 1, 4, 2);
  }
}

function drawMageFrame(ctx, px, py, body, dark, light, accent, direction, animCol) {
  ctx.fillStyle = dark;
  ctx.fillRect(px + 3, py - 1, 4, 2);
  ctx.fillRect(px + 4, py - 2, 2, 1);

  ctx.fillStyle = body;
  ctx.fillRect(px + 1, py + 2, 8, 7);
  ctx.fillStyle = light;
  ctx.fillRect(px + 2, py + 3, 6, 1);

  ctx.fillStyle = accent;
  if (direction === 'left') {
    ctx.fillRect(px - 2, py + 1, 2, 8);
    ctx.fillStyle = '#e8daef';
    ctx.fillRect(px - 2, py + 1, 1, 2);
    if (animCol === ANIMATION.ATTACK) {
      ctx.fillStyle = '#f5b041';
      ctx.fillRect(px - 4, py + 2, 2, 2);
    }
  } else if (direction === 'right') {
    ctx.fillRect(px + 10, py + 1, 2, 8);
    ctx.fillStyle = '#e8daef';
    ctx.fillRect(px + 11, py + 1, 1, 2);
    if (animCol === ANIMATION.ATTACK) {
      ctx.fillStyle = '#f5b041';
      ctx.fillRect(px + 12, py + 2, 2, 2);
    }
  } else if (direction === 'down') {
    ctx.fillRect(px + 4, py + 8, 2, 3);
    ctx.fillStyle = '#e8daef';
    ctx.fillRect(px + 4, py + 8, 1, 1);
  } else {
    ctx.fillRect(px + 4, py - 2, 2, 3);
  }
}

function drawRangerFrame(ctx, px, py, body, dark, light, accent, direction, animCol) {
  ctx.fillStyle = dark;
  ctx.fillRect(px + 2, py, 6, 3);
  ctx.fillRect(px + 3, py + 1, 4, 1);

  ctx.fillStyle = body;
  ctx.fillRect(px + 1, py + 3, 8, 6);
  ctx.fillStyle = light;
  ctx.fillRect(px + 2, py + 4, 2, 3);

  ctx.fillStyle = accent;
  if (direction === 'left') {
    ctx.fillRect(px + 8, py + 2, 2, 6);
    ctx.fillRect(px + 9, py + 3, 1, 4);
    if (animCol === ANIMATION.ATTACK) {
      ctx.fillStyle = '#f8f9f9';
      ctx.fillRect(px - 3, py + 4, 4, 1);
    }
  } else if (direction === 'right') {
    ctx.fillRect(px, py + 2, 2, 6);
    ctx.fillRect(px, py + 3, 1, 4);
    if (animCol === ANIMATION.ATTACK) {
      ctx.fillStyle = '#f8f9f9';
      ctx.fillRect(px + 9, py + 4, 4, 1);
    }
  } else if (direction === 'down') {
    ctx.fillRect(px + 2, py + 8, 6, 2);
    ctx.fillRect(px + 4, py + 9, 2, 1);
  } else {
    ctx.fillRect(px + 3, py - 1, 4, 2);
  }
}

function drawNecromancerFrame(ctx, px, py, body, dark, light, accent, direction, animCol) {
  ctx.fillStyle = dark;
  ctx.fillRect(px + 2, py, 6, 2);
  ctx.fillRect(px + 1, py + 2, 8, 1);

  ctx.fillStyle = body;
  ctx.fillRect(px + 1, py + 3, 8, 7);
  ctx.fillStyle = light;
  ctx.fillRect(px + 2, py + 4, 2, 3);
  ctx.fillStyle = accent;
  ctx.fillRect(px + 3, py + 6, 4, 1);

  // Blood vial / ritual dagger
  if (direction === 'left') {
    ctx.fillStyle = accent;
    ctx.fillRect(px - 2, py + 4, 2, 5);
    ctx.fillStyle = '#f5b7b1';
    ctx.fillRect(px - 2, py + 3, 2, 1);
    if (animCol === ANIMATION.ATTACK) {
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(px - 5, py + 5, 3, 2);
    }
  } else if (direction === 'right') {
    ctx.fillStyle = accent;
    ctx.fillRect(px + 10, py + 4, 2, 5);
    ctx.fillStyle = '#f5b7b1';
    ctx.fillRect(px + 10, py + 3, 2, 1);
    if (animCol === ANIMATION.ATTACK) {
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(px + 12, py + 5, 3, 2);
    }
  } else if (direction === 'down') {
    ctx.fillStyle = accent;
    ctx.fillRect(px + 4, py + 9, 2, 3);
  } else {
    ctx.fillStyle = accent;
    ctx.fillRect(px + 4, py - 1, 2, 3);
  }
}

function drawCharacterFrame(ctx, ox, oy, characterClass, color, accent, direction, animCol) {
  const body = color;
  const dark = shade(color, -35);
  const light = shade(color, 45);
  const skin = '#f0d5b8';
  const hair =
    characterClass === 'mage'
      ? '#5d4037'
      : characterClass === 'necromancer'
        ? '#1a0a0c'
        : '#2c1810';

  ctx.clearRect(ox, oy, SPRITE_FRAME_SIZE, SPRITE_FRAME_SIZE);

  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(ox + 8, oy + 14.5, 5, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();

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

  drawLegs(ctx, px, py, dark, animCol);

  if (characterClass === 'warrior') {
    drawWarriorFrame(ctx, px, py, body, dark, light, accent, direction, animCol);
    drawHead(ctx, px, py, skin, hair);
  } else if (characterClass === 'mage') {
    drawMageFrame(ctx, px, py, body, dark, light, accent, direction, animCol);
    drawHead(ctx, px, py, skin, hair);
  } else if (characterClass === 'necromancer') {
    drawNecromancerFrame(ctx, px, py, body, dark, light, accent, direction, animCol);
    drawHead(ctx, px, py, '#e8c4b8', hair);
  } else {
    drawRangerFrame(ctx, px, py, body, dark, light, accent, direction, animCol);
    drawHead(ctx, px, py, skin, '#3e2723');
  }
}

const CLASS_ACCENTS = {
  warrior: '#bdc3c7',
  mage: '#af7ac5',
  ranger: '#f4d03f',
  necromancer: '#e74c3c',
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
        characterClass,
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
