import { getRarityColor } from '/shared/items.js';
import { ItemIconAtlas } from './ItemIconAtlas.js';

const ICON_BASE_SIZE = 16;
const LOOT_SCALE = 1.1;

function hashDropId(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return hash;
}

export class LootRenderer {
  constructor() {
    this.atlas = new ItemIconAtlas();
  }

  draw(ctx, lootDrops, camera, timestamp = 0) {
    const zoom = camera.zoom ?? 1;

    for (const drop of lootDrops) {
      const locked = !!drop.pickupLocked;
      const screen = camera.worldToScreen(drop.x, drop.y);
      const bob = Math.sin(timestamp * 0.004 + hashDropId(drop.id) * 0.17) * 2 * zoom;
      const x = screen.x;
      const y = screen.y + bob;
      const size = ICON_BASE_SIZE * LOOT_SCALE * zoom;
      const half = size / 2;
      const rarityColor = getRarityColor(drop.item.rarity);
      const icon = this.atlas.getForItem(drop.item);

      this.drawGroundShadow(ctx, x, y, half);

      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = rarityColor;
      ctx.lineWidth = Math.max(2, 3 * zoom);
      ctx.beginPath();
      ctx.arc(x, y, half + 3 * zoom, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = locked ? 0.35 : 1;
      ctx.drawImage(icon, x - half, y - half, size, size);
      ctx.restore();

      ctx.strokeStyle = rarityColor;
      ctx.lineWidth = Math.max(1, 1.5 * zoom);
      ctx.strokeRect(x - half, y - half, size, size);
    }
  }

  drawGroundShadow(ctx, x, y, half) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(x, y + half * 0.45, half * 0.65, half * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}
