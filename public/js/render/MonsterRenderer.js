import { drawHpBar } from './HpBar.js';

export class MonsterRenderer {
  draw(ctx, monsters, camera, hitFlashes = new Set(), now = Date.now()) {
    const scale = camera.zoom ?? 1;

    for (const monster of monsters) {
      const screen = camera.worldToScreen(monster.x, monster.y);
      const size = 14 * scale;
      const half = size / 2;
      const flashing = hitFlashes.has(monster.id);

      if (flashing) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      } else {
        ctx.fillStyle = monster.color || '#888';
      }
      ctx.fillRect(screen.x - half, screen.y - half, size, size);

      if (flashing) {
        ctx.strokeStyle = 'rgba(255, 80, 60, 0.9)';
        ctx.lineWidth = 2;
        ctx.strokeRect(screen.x - half, screen.y - half, size, size);
      }

      ctx.fillStyle = '#fff';
      ctx.font = `${9 * scale}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(monster.label, screen.x, screen.y - half - 4);

      drawHpBar(ctx, screen.x, screen.y - half, monster.hp, monster.maxHp, 24 * scale);
    }
  }
}
