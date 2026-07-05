import { MapRenderer } from './MapRenderer.js';
import { SpriteManager } from './SpriteManager.js';
import { MonsterRenderer } from './MonsterRenderer.js';
import { LootRenderer } from './LootRenderer.js';
import { PlayerHud } from '../ui/PlayerHud.js';

export class Renderer {
  constructor(canvas, camera) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.camera = camera;
    this.mapRenderer = new MapRenderer();
    this.spriteManager = new SpriteManager();
    this.monsterRenderer = new MonsterRenderer();
    this.lootRenderer = new LootRenderer();
    this.playerHud = new PlayerHud();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  draw(worldState, displayPlayer, timestamp, overlays = {}) {
    const { map, players, monsters = [], loot = [] } = worldState;
    const { moveTarget = null } = overlays;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.mapRenderer.draw(this.ctx, map, this.camera);

    const anyMoving = players.some((p) =>
      p.id === displayPlayer.id ? displayPlayer.moving : p.moving
    );
    this.spriteManager.updateAnim(timestamp, anyMoving);

    this.monsterRenderer.draw(this.ctx, monsters, this.camera);
    this.lootRenderer.draw(this.ctx, loot, this.camera);

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
            attacking: displayPlayer.attacking ?? player.attacking,
          }
        : player;
      this.spriteManager.drawCharacter(this.ctx, renderPlayer, this.camera);
    }

    this.playerHud.draw(this.ctx, displayPlayer);
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
}
