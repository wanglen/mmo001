import { CHARACTER_CLASSES, PLAYER_SIZE } from '/shared/constants.js';

export class SpriteManager {
  constructor() {
    this.animFrame = 0;
    this.lastAnimTime = 0;
  }

  updateAnim(timestamp) {
    if (timestamp - this.lastAnimTime > 200) {
      this.animFrame = 1 - this.animFrame;
      this.lastAnimTime = timestamp;
    }
  }

  drawCharacter(ctx, player, camera) {
    const screen = camera.worldToScreen(player.x, player.y);
    const cls = CHARACTER_CLASSES[player.characterClass];
    const bob = player.moving ? this.animFrame * 2 : 0;
    const size = PLAYER_SIZE;
    const half = size / 2;

    ctx.fillStyle = cls?.color || '#888';
    ctx.fillRect(screen.x - half, screen.y - half + bob, size, size);

    ctx.fillStyle = '#fff';
    this.drawDirectionIndicator(ctx, screen.x, screen.y + bob, player.direction, half);

    ctx.fillStyle = '#fff';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(player.name, screen.x, screen.y - half - 6 + bob);
  }

  drawDirectionIndicator(ctx, x, y, direction, half) {
    ctx.beginPath();
    switch (direction) {
      case 'up':
        ctx.moveTo(x, y - half - 4);
        ctx.lineTo(x - 4, y - half + 2);
        ctx.lineTo(x + 4, y - half + 2);
        break;
      case 'down':
        ctx.moveTo(x, y + half + 4);
        ctx.lineTo(x - 4, y + half - 2);
        ctx.lineTo(x + 4, y + half - 2);
        break;
      case 'left':
        ctx.moveTo(x - half - 4, y);
        ctx.lineTo(x - half + 2, y - 4);
        ctx.lineTo(x - half + 2, y + 4);
        break;
      case 'right':
        ctx.moveTo(x + half + 4, y);
        ctx.lineTo(x + half - 2, y - 4);
        ctx.lineTo(x + half - 2, y + 4);
        break;
    }
    ctx.closePath();
    ctx.fill();
  }
}
