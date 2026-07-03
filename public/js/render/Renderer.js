import { MapRenderer } from './MapRenderer.js';
import { SpriteManager } from './SpriteManager.js';

export class Renderer {
  constructor(canvas, camera) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.camera = camera;
    this.mapRenderer = new MapRenderer();
    this.spriteManager = new SpriteManager();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  draw(worldState, displayPlayer, timestamp, overlays = {}) {
    const { map, players } = worldState;
    const { moveTarget = null, aimTarget = null } = overlays;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.mapRenderer.draw(this.ctx, map, this.camera);

    const anyMoving = players.some((p) =>
      p.id === displayPlayer.id ? displayPlayer.moving : p.moving
    );
    this.spriteManager.updateAnim(timestamp, anyMoving);

    if (moveTarget) {
      this.drawMoveTarget(moveTarget);
    }

    for (const player of players) {
      const renderPlayer = player.id === displayPlayer.id
        ? {
            ...player,
            x: displayPlayer.x,
            y: displayPlayer.y,
            moving: displayPlayer.moving,
            facing: displayPlayer.facing ?? player.facing,
          }
        : player;
      this.spriteManager.drawCharacter(this.ctx, renderPlayer, this.camera);
    }

    if (aimTarget) {
      this.drawAimLine(displayPlayer, aimTarget);
    }
  }

  drawMoveTarget(target) {
    const screen = this.camera.worldToScreen(target.x, target.y);

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(screen.x, screen.y, 8, 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.beginPath();
    this.ctx.arc(screen.x, screen.y, 3, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawAimLine(player, aimTarget) {
    const from = this.camera.worldToScreen(player.x, player.y);
    const to = this.camera.worldToScreen(aimTarget.x, aimTarget.y);

    this.ctx.strokeStyle = 'rgba(255, 220, 100, 0.6)';
    this.ctx.lineWidth = 1.5;
    this.ctx.setLineDash([4, 4]);
    this.ctx.beginPath();
    this.ctx.moveTo(from.x, from.y);
    this.ctx.lineTo(to.x, to.y);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }
}
