import { getRarityColor } from '/shared/items.js';

export class LootRenderer {
  draw(ctx, lootDrops, camera) {
    for (const drop of lootDrops) {
      const screen = camera.worldToScreen(drop.x, drop.y);
      const color = getRarityColor(drop.item.rarity);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(screen.x - 7, screen.y - 7, 14, 14);

      ctx.fillStyle = color;
      ctx.fillRect(screen.x - 5, screen.y - 5, 10, 10);

      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.strokeRect(screen.x - 5, screen.y - 5, 10, 10);
    }
  }
}
