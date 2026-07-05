import { SKILLS } from '/shared/skills.js';

export class SkillEffectRenderer {
  constructor() {
    this.localFx = [];
  }

  addLocalFx(fx) {
    this.localFx.push({ ...fx, at: fx.at ?? Date.now() });
  }

  prune(now) {
    this.localFx = this.localFx.filter((fx) => {
      const duration = fx.durationMs ?? 400;
      return now - fx.at < duration + 200;
    });
  }

  draw(ctx, skillFx = [], camera, now) {
    this.prune(now);

    const allFx = [
      ...skillFx,
      ...this.localFx.map((fx) => ({ ...fx, playerId: 'local' })),
    ];

    for (const fx of allFx) {
      const duration = fx.durationMs ?? 400;
      const age = Math.max(0, now - fx.at);
      if (age >= duration + 180) continue;

      const skill = SKILLS[fx.skillId];
      if (!skill) continue;

      if (fx.skillId === 'fireball') {
        this.drawFireball(ctx, fx, camera, now, duration);
        continue;
      }

      if (fx.skillId === 'icebolt') {
        this.drawIcebolt(ctx, fx, camera, now, duration);
        continue;
      }

      const progress = Math.min(1, age / duration);
      const alpha = 1 - progress;

      switch (skill.type) {
        case 'melee_aoe':
          this.drawMeleeArc(ctx, fx, camera, alpha);
          break;
        case 'dash':
          this.drawDash(ctx, fx, camera, alpha, progress);
          break;
        case 'projectile':
          this.drawGenericProjectile(ctx, fx, camera, alpha, progress);
          break;
        case 'ground_aoe':
          this.drawGroundAoE(ctx, fx, skill, camera, alpha, progress);
          break;
        case 'single_target':
          this.drawGenericProjectile(ctx, fx, camera, alpha, progress);
          break;
      }
    }
  }

  drawFireball(ctx, fx, camera, now, duration) {
    const age = Math.max(0, now - fx.at);
    const start = camera.worldToScreen(fx.x, fx.y);
    const end = camera.worldToScreen(fx.impactX, fx.impactY);
    const travelEnd = duration * 0.72;
    const travelProgress = Math.min(1, age / travelEnd);
    const x = start.x + (end.x - start.x) * travelProgress;
    const y = start.y + (end.y - start.y) * travelProgress;

    // Ember trail
    for (let i = 0; i < 5; i++) {
      const t = Math.max(0, travelProgress - i * 0.08);
      const tx = start.x + (end.x - start.x) * t;
      const ty = start.y + (end.y - start.y) * t;
      const trailAlpha = (1 - i * 0.18) * (1 - travelProgress * 0.3);
      ctx.fillStyle = `rgba(230, 126, 34, ${trailAlpha * 0.5})`;
      ctx.beginPath();
      ctx.arc(tx, ty, 6 - i, 0, Math.PI * 2);
      ctx.fill();
    }

    // Core orb
    const pulse = 1 + Math.sin(age * 0.03) * 0.15;
    const radius = 9 * pulse;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, 'rgba(255, 250, 200, 0.95)');
    gradient.addColorStop(0.45, 'rgba(255, 140, 40, 0.9)');
    gradient.addColorStop(1, 'rgba(200, 50, 10, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    if (travelProgress >= 1) {
      const impactAge = age - travelEnd;
      const impactT = Math.min(1, impactAge / (duration - travelEnd + 120));
      const impactAlpha = 1 - impactT;

      if (fx.missed) {
        this.drawMissPuff(ctx, end.x, end.y, impactAlpha, 'fire');
      } else {
        this.drawFireExplosion(ctx, end.x, end.y, impactAlpha, impactT);
      }
    }
  }

  drawIcebolt(ctx, fx, camera, now, duration) {
    const age = Math.max(0, now - fx.at);
    const start = camera.worldToScreen(fx.x, fx.y);
    const end = camera.worldToScreen(fx.impactX, fx.impactY);
    const travelEnd = duration * 0.78;
    const travelProgress = Math.min(1, age / travelEnd);
    const x = start.x + (end.x - start.x) * travelProgress;
    const y = start.y + (end.y - start.y) * travelProgress;
    const angle = Math.atan2(end.y - start.y, end.x - start.x);

    // Frost trail
    for (let i = 0; i < 4; i++) {
      const t = Math.max(0, travelProgress - i * 0.1);
      const tx = start.x + (end.x - start.x) * t;
      const ty = start.y + (end.y - start.y) * t;
      ctx.fillStyle = `rgba(180, 230, 255, ${0.35 - i * 0.07})`;
      ctx.beginPath();
      ctx.arc(tx, ty, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Shard
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = 'rgba(220, 245, 255, 0.95)';
    ctx.strokeStyle = 'rgba(100, 180, 255, 0.9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-6, -5);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-6, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    if (travelProgress >= 1) {
      const impactAge = age - travelEnd;
      const impactT = Math.min(1, impactAge / (duration - travelEnd + 100));
      const impactAlpha = 1 - impactT;

      if (fx.missed) {
        this.drawMissPuff(ctx, end.x, end.y, impactAlpha, 'ice');
      } else {
        this.drawIceShatter(ctx, end.x, end.y, impactAlpha, impactT);
      }
    }
  }

  drawFireExplosion(ctx, x, y, alpha, t) {
    const radius = 8 + t * 22;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(255, 240, 150, ${alpha * 0.9})`);
    gradient.addColorStop(0.4, `rgba(255, 120, 30, ${alpha * 0.6})`);
    gradient.addColorStop(1, 'rgba(200, 40, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  drawIceShatter(ctx, x, y, alpha, t) {
    const radius = 6 + t * 18;
    ctx.strokeStyle = `rgba(160, 220, 255, ${alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 * i) / 6 + t;
      const len = radius * 0.8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
      ctx.stroke();
    }
  }

  drawMissPuff(ctx, x, y, alpha, element) {
    const isFire = element === 'fire';
    const color = isFire ? 'rgba(255, 160, 80' : 'rgba(160, 210, 255';
    const radius = isFire ? 14 : 12;

    ctx.strokeStyle = `${color}, ${alpha * 0.7})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = `${color}, ${alpha * 0.25})`;
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.55, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Miss', x, y - radius - 4);
  }

  drawMeleeArc(ctx, fx, camera, alpha) {
    const origin = camera.worldToScreen(fx.x, fx.y);
    const target = camera.worldToScreen(fx.targetX, fx.targetY);
    const angle = Math.atan2(target.y - origin.y, target.x - origin.x);

    ctx.save();
    ctx.translate(origin.x, origin.y);
    ctx.rotate(angle);
    ctx.fillStyle = `rgba(231, 76, 60, ${alpha * 0.35})`;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 48, -Math.PI / 3, Math.PI / 3);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 200, 100, ${alpha})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    if (fx.missed) {
      this.drawMissPuff(ctx, target.x, target.y, alpha * 0.8, 'fire');
    }
  }

  drawDash(ctx, fx, camera, alpha, progress) {
    const start = camera.worldToScreen(fx.x, fx.y);
    const end = camera.worldToScreen(fx.targetX, fx.targetY);
    const x = start.x + (end.x - start.x) * progress;
    const y = start.y + (end.y - start.y) * progress;

    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    ctx.fillStyle = `rgba(231, 76, 60, ${alpha * 0.5})`;
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fill();
  }

  drawGenericProjectile(ctx, fx, camera, alpha, progress) {
    const start = camera.worldToScreen(fx.x, fx.y);
    const end = camera.worldToScreen(fx.impactX, fx.impactY);
    const x = start.x + (end.x - start.x) * progress;
    const y = start.y + (end.y - start.y) * progress;

    ctx.fillStyle = `rgba(46, 204, 113, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();

    if (progress >= 0.95 && fx.missed) {
      this.drawMissPuff(ctx, end.x, end.y, alpha, 'ice');
    }
  }

  drawGroundAoE(ctx, fx, skill, camera, alpha, progress) {
    const cx = skill.range ? fx.targetX : fx.x;
    const cy = skill.range ? fx.targetY : fx.y;
    const center = camera.worldToScreen(cx, cy);
    const radius = (skill.radius ?? 40) * (0.5 + progress * 0.5);

    ctx.fillStyle = `rgba(39, 174, 96, ${alpha * 0.35})`;
    ctx.strokeStyle = `rgba(39, 174, 96, ${alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (fx.missed) {
      this.drawMissPuff(ctx, center.x, center.y, alpha * 0.7, 'ice');
    }
  }
}
