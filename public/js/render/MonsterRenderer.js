import { PLAYER_SIZE } from '/shared/constants.js';
import { inferMonsterFacing } from '/shared/monsterSprites.js';
import { MonsterAtlas } from './MonsterAtlas.js';
import { drawHpBar, getEntityOverheadOffsets } from './HpBar.js';

const RENDER_SCALE = 1.35;

/**
 * Draws monsters with type sprites, shadow, nameplate, and HP bar.
 */
export class MonsterRenderer {
  constructor() {
    this.atlas = new MonsterAtlas();
    this.walkFrame = 0;
    this.lastAnimTime = 0;
    this.prevPositions = new Map();
  }

  updateAnim(timestamp, anyMoving) {
    if (!anyMoving) return;
    if (timestamp - this.lastAnimTime > 180) {
      this.walkFrame = 1 - this.walkFrame;
      this.lastAnimTime = timestamp;
    }
  }

  draw(ctx, monsters, camera, hitFlashes = new Set(), hoveredMonsterId = null) {
    const zoom = camera.zoom ?? 1;
    const size = PLAYER_SIZE * RENDER_SCALE * zoom;
    const half = size / 2;
    const { barYOffset, nameplateCenterOffset } = getEntityOverheadOffsets(half, zoom);
    const activeIds = new Set();

    for (const monster of monsters) {
      activeIds.add(monster.id);
      const prev = this.prevPositions.get(monster.id);
      const facing = inferMonsterFacing(prev?.x, prev?.y, monster.x, monster.y);
      this.prevPositions.set(monster.id, { x: monster.x, y: monster.y });

      const screen = camera.worldToScreen(monster.x, monster.y);
      const flashing = hitFlashes.has(monster.id);
      const flip = facing === 'left';
      const sheet = this.atlas.get(monster.type, monster.moving, this.walkFrame);

      this.drawGroundShadow(ctx, screen.x, screen.y, half);

      ctx.save();
      ctx.imageSmoothingEnabled = false;

      if (flashing) {
        ctx.filter = 'brightness(1.8) saturate(0.4)';
      }

      if (flip) {
        ctx.translate(screen.x + half, screen.y - half);
        ctx.scale(-1, 1);
        ctx.drawImage(sheet, 0, 0, sheet.width, sheet.height, 0, 0, size, size);
      } else {
        ctx.drawImage(sheet, 0, 0, sheet.width, sheet.height, screen.x - half, screen.y - half, size, size);
      }
      ctx.restore();

      if (flashing) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 80, 60, 0.85)';
        ctx.lineWidth = 2 * zoom;
        ctx.strokeRect(screen.x - half, screen.y - half, size, size);
        ctx.restore();
      }

      drawHpBar(ctx, screen.x, screen.y, monster.hp, monster.maxHp, 28 * zoom, barYOffset);

      if (monster.id === hoveredMonsterId) {
        this.drawNameplate(ctx, screen.x, screen.y + nameplateCenterOffset, monster.label, zoom);
      }
    }

    for (const id of this.prevPositions.keys()) {
      if (!activeIds.has(id)) this.prevPositions.delete(id);
    }
  }

  drawGroundShadow(ctx, x, y, half) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.beginPath();
    ctx.ellipse(x, y + half * 0.55, half * 0.72, half * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawNameplate(ctx, x, y, name, zoom) {
    const fontSize = Math.max(10, 11 * zoom);
    ctx.font = `${fontSize}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const width = ctx.measureText(name).width + 10 * zoom;
    const height = 14 * zoom;
    const left = x - width / 2;
    const top = y - height / 2;

    ctx.fillStyle = 'rgba(40, 10, 10, 0.72)';
    ctx.beginPath();
    ctx.roundRect(left, top, width, height, 4 * zoom);
    ctx.fill();

    ctx.fillStyle = '#f5d0c5';
    ctx.fillText(name, x, y);
  }
}
