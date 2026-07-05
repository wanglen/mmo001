import { DAMAGE_NUMBER_MS } from '/shared/combatFx.js';

export class CombatFxRenderer {
  draw(ctx, combatFx = [], camera, now) {
    for (const fx of combatFx) {
      if (fx.type === 'damage') {
        this.drawDamageNumber(ctx, fx, camera, now);
      }
    }
  }

  drawDamageNumber(ctx, fx, camera, now) {
    const zoom = camera.zoom ?? 1;
    const age = Math.max(0, now - fx.at);
    if (age >= DAMAGE_NUMBER_MS) return;

    const progress = age / DAMAGE_NUMBER_MS;
    const screen = camera.worldToScreen(fx.x, fx.y);
    screen.y -= (12 + progress * 28) * zoom;
    const alpha = 1 - progress * 0.85;

    ctx.save();
    ctx.font = `bold ${13 * zoom}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(255, 235, 120, ${alpha})`;
    ctx.strokeStyle = `rgba(80, 20, 10, ${alpha * 0.8})`;
    ctx.lineWidth = 3 * zoom;
    ctx.strokeText(String(fx.value), screen.x, screen.y);
    ctx.fillText(String(fx.value), screen.x, screen.y);
    ctx.restore();
  }

  /** @returns {Set<string>} monster ids currently flashing */
  getHitFlashes(combatFx, now) {
    const flashing = new Set();
    for (const fx of combatFx) {
      if (fx.type === 'hitFlash' && Math.max(0, now - fx.at) < 200) {
        flashing.add(fx.monsterId);
      }
    }
    return flashing;
  }
}
