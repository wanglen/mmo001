import { PLAYER_SIZE } from '/shared/constants.js';
import { resolveSpriteFrame, getSourceRect } from '/shared/sprites.js';
import { SpriteAtlas } from './SpriteAtlas.js';

export class SpriteManager {
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

  drawCharacter(ctx, player, camera) {
    const screen = camera.worldToScreen(player.x, player.y);
    const scale = camera.zoom ?? 1;
    const size = PLAYER_SIZE * scale;
    const half = size / 2;
    const facing = player.facing || player.direction || 'down';

    const { col, row, frameSize } = resolveSpriteFrame(
      { moving: player.moving, attacking: player.attacking },
      facing,
      this.walkFrame
    );
    const { sx, sy, sw, sh } = getSourceRect(col, row, frameSize);
    const sheet = this.atlas.get(player.characterClass);

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sheet, sx, sy, sw, sh, screen.x - half, screen.y - half, size, size);

    ctx.fillStyle = '#fff';
    this.drawDirectionIndicator(ctx, screen.x, screen.y, facing, half * 0.9);

    ctx.fillStyle = '#fff';
    ctx.font = `${11 * scale}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(player.name, screen.x, screen.y - half - 6);
  }

  drawDirectionIndicator(ctx, x, y, direction, half) {
    ctx.beginPath();
    switch (direction) {
      case 'up':
        ctx.moveTo(x, y - half - 3);
        ctx.lineTo(x - 3, y - half + 2);
        ctx.lineTo(x + 3, y - half + 2);
        break;
      case 'down':
        ctx.moveTo(x, y + half + 3);
        ctx.lineTo(x - 3, y + half - 2);
        ctx.lineTo(x + 3, y + half - 2);
        break;
      case 'left':
        ctx.moveTo(x - half - 3, y);
        ctx.lineTo(x - half + 2, y - 3);
        ctx.lineTo(x - half + 2, y + 3);
        break;
      case 'right':
        ctx.moveTo(x + half + 3, y);
        ctx.lineTo(x + half - 2, y - 3);
        ctx.lineTo(x + half - 2, y + 3);
        break;
    }
    ctx.closePath();
    ctx.fill();
  }
}
