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

  draw(worldState, displayPlayer, timestamp) {
    const { map, players } = worldState;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.mapRenderer.draw(this.ctx, map, this.camera);
    this.spriteManager.updateAnim(timestamp);

    for (const player of players) {
      const renderPlayer = player.id === displayPlayer.id
        ? { ...player, x: displayPlayer.x, y: displayPlayer.y, moving: displayPlayer.moving }
        : player;
      this.spriteManager.drawCharacter(this.ctx, renderPlayer, this.camera);
    }
  }
}
