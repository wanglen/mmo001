import { MONSTER_SPRITE_SIZE, resolveMonsterWalkFrame } from '/shared/monsterSprites.js';
import { MONSTER_TYPES } from '/shared/monsters.js';

const FRAME_SIZE = MONSTER_SPRITE_SIZE;

function shade(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function drawGoblin(ctx, px, py, body, dark, walkFrame) {
  ctx.fillStyle = dark;
  ctx.fillRect(px + 2, py, 2, 3);
  ctx.fillRect(px + 12, py, 2, 3);

  ctx.fillStyle = body;
  ctx.fillRect(px + 4, py + 2, 8, 7);
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(px + 5, py + 4, 2, 2);
  ctx.fillRect(px + 9, py + 4, 2, 2);

  ctx.fillStyle = dark;
  if (walkFrame === 0) {
    ctx.fillRect(px + 5, py + 9, 2, 4);
    ctx.fillRect(px + 9, py + 10, 2, 3);
  } else {
    ctx.fillRect(px + 5, py + 10, 2, 3);
    ctx.fillRect(px + 9, py + 9, 2, 4);
  }

  ctx.fillStyle = '#95a5a6';
  ctx.fillRect(px + 11, py + 5, 1, 5);
  ctx.fillRect(px + 12, py + 4, 2, 2);
}

function drawSkeleton(ctx, px, py, bone, dark, walkFrame) {
  ctx.fillStyle = bone;
  ctx.fillRect(px + 5, py + 1, 6, 5);
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(px + 6, py + 3, 2, 2);
  ctx.fillRect(px + 9, py + 3, 2, 2);

  ctx.fillStyle = bone;
  ctx.fillRect(px + 6, py + 6, 4, 1);
  ctx.fillRect(px + 4, py + 7, 8, 4);
  ctx.fillStyle = dark;
  ctx.fillRect(px + 7, py + 8, 2, 2);

  ctx.fillStyle = bone;
  if (walkFrame === 0) {
    ctx.fillRect(px + 4, py + 11, 2, 4);
    ctx.fillRect(px + 10, py + 12, 2, 3);
  } else {
    ctx.fillRect(px + 4, py + 12, 2, 3);
    ctx.fillRect(px + 10, py + 11, 2, 4);
  }
}

function drawBat(ctx, px, py, body, dark, walkFrame) {
  const wingY = walkFrame === 0 ? py + 4 : py + 3;
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.moveTo(px + 3, wingY + 2);
  ctx.lineTo(px + 8, wingY);
  ctx.lineTo(px + 8, wingY + 5);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(px + 13, wingY + 2);
  ctx.lineTo(px + 8, wingY);
  ctx.lineTo(px + 8, wingY + 5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = body;
  ctx.fillRect(px + 7, py + 5, 4, 5);
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(px + 8, py + 6, 1, 1);
  ctx.fillRect(px + 10, py + 6, 1, 1);

  ctx.fillStyle = dark;
  ctx.fillRect(px + 7, py + 10, 1, 2);
  ctx.fillRect(px + 10, py + 10, 1, 2);
}

const DRAWERS = {
  goblin: drawGoblin,
  skeleton: drawSkeleton,
  bat: drawBat,
};

/** Cached 16×16 monster sprites per type and walk frame. */
export class MonsterAtlas {
  constructor() {
    this.cache = new Map();
  }

  get(type, moving, walkFrame) {
    const col = resolveMonsterWalkFrame(moving, walkFrame);
    const key = `${type}:${col}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const def = MONSTER_TYPES[type] ?? MONSTER_TYPES.goblin;
    const drawer = DRAWERS[type] ?? DRAWERS.goblin;
    const body = def.color;
    const dark = shade(body, -45);

    const canvas = document.createElement('canvas');
    canvas.width = FRAME_SIZE;
    canvas.height = FRAME_SIZE;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    drawer(ctx, 0, 0, body, dark, col);

    this.cache.set(key, canvas);
    return canvas;
  }
}
