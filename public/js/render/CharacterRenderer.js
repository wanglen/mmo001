import { PLAYER_SIZE, CHARACTER_CLASSES } from '/shared/constants.js';
import { toCardinalDirection } from '/shared/movement.js';
import { resolveSpriteFrame, getSourceRect } from '/shared/sprites.js';
import { SpriteAtlas } from './SpriteAtlas.js';
import { drawHpBar, getEntityOverheadOffsets } from './HpBar.js';

/** Slightly larger on-screen footprint than raw sprite pixels. */
const RENDER_SCALE = 1.35;

/**
 * Draws player characters with class sprites, shadow, nameplate, and HP bar.
 */
export class CharacterRenderer {
  constructor() {
    this.atlas = new SpriteAtlas();
    this.walkFrame = 0;
    this.lastAnimTime = 0;
  }

  updateAnim(timestamp, anyMoving) {
    if (!anyMoving) return;
    if (timestamp - this.lastAnimTime > 180) {
      this.walkFrame = 1 - this.walkFrame;
      this.lastAnimTime = timestamp;
    }
  }

  draw(ctx, player, camera) {
    const screen = camera.worldToScreen(player.x, player.y);
    const zoom = camera.zoom ?? 1;
    const size = PLAYER_SIZE * RENDER_SCALE * zoom;
    const half = size / 2;
    const facing = player.facing || toCardinalDirection(player.direction) || 'down';
    const dead = !!player.dead;
    const { barYOffset, nameplateCenterOffset } = getEntityOverheadOffsets(half, zoom);

    this.drawGroundShadow(ctx, screen.x, screen.y, half);

    const { col, row, frameSize } = resolveSpriteFrame(
      { moving: player.moving && !dead, attacking: player.attacking && !dead },
      facing,
      this.walkFrame
    );
    const { sx, sy, sw, sh } = getSourceRect(col, row, frameSize);
    const sheet = this.atlas.get(player.characterClass);

    ctx.save();
    if (dead) {
      ctx.globalAlpha = 0.45;
      ctx.filter = 'grayscale(1)';
    }

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sheet, sx, sy, sw, sh, screen.x - half, screen.y - half, size, size);
    ctx.restore();

    if (!dead) {
      drawHpBar(ctx, screen.x, screen.y, player.hp, player.maxHp, 28 * zoom, barYOffset);
      this.drawNameplate(
        ctx,
        screen.x,
        screen.y + nameplateCenterOffset,
        player.name,
        zoom,
        false,
        player.characterClass
      );
    } else {
      this.drawNameplate(
        ctx,
        screen.x,
        screen.y - half - 6,
        player.name,
        zoom,
        true,
        player.characterClass
      );
    }
  }

  drawGroundShadow(ctx, x, y, half) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.beginPath();
    ctx.ellipse(x, y + half * 0.55, half * 0.72, half * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawNameplate(ctx, x, y, name, zoom, dead = false, characterClass = null) {
    const fontSize = Math.max(10, 11 * zoom);
    ctx.font = `${fontSize}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const classMeta = characterClass ? CHARACTER_CLASSES[characterClass] : null;
    const badgeSize = 8 * zoom;
    const badgeGap = classMeta ? 4 * zoom : 0;
    const text = dead ? `${name} (dead)` : name;
    const textWidth = ctx.measureText(text).width;
    const width = textWidth + 10 * zoom + badgeGap + (classMeta ? badgeSize : 0);
    const height = 14 * zoom;
    const left = x - width / 2;
    const top = y - height / 2;

    ctx.fillStyle = dead ? 'rgba(80, 20, 20, 0.75)' : 'rgba(0, 0, 0, 0.58)';
    ctx.beginPath();
    ctx.roundRect(left, top, width, height, 4 * zoom);
    ctx.fill();

    let textX = x;
    if (classMeta) {
      const badgeX = left + 5 * zoom + badgeSize / 2;
      const badgeY = y;
      ctx.fillStyle = classMeta.color;
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, badgeSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = Math.max(1, zoom);
      ctx.stroke();
      textX = left + 5 * zoom + badgeSize + badgeGap + textWidth / 2;
    }

    ctx.fillStyle = dead ? '#f5b7b1' : '#f4f6f7';
    ctx.fillText(text, textX, y);
  }
}
