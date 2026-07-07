import { SKILLS } from '/shared/skills.js';

function zoomScale(camera) {
  return camera.zoom ?? 1;
}

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

      if (fx.skillId === 'chain_spark') {
        this.drawChainSpark(ctx, fx, camera, now, duration);
        continue;
      }

      if (fx.skillId === 'meteor') {
        this.drawMeteor(ctx, fx, camera, now, duration);
        continue;
      }

      if (fx.skillId === 'multishot') {
        this.drawMultishot(ctx, fx, camera, now, duration);
        continue;
      }

      if (fx.skillId === 'frost_nova') {
        this.drawFrostNova(ctx, fx, camera, now, duration);
        continue;
      }

      if (fx.skillId === 'cleave') {
        this.drawCleave(ctx, fx, camera, now, duration);
        continue;
      }

      if (fx.skillId === 'whirlwind') {
        this.drawWhirlwind(ctx, fx, camera, now, duration);
        continue;
      }

      if (fx.skillId === 'shield_bash') {
        this.drawShieldBash(ctx, fx, camera, now, duration);
        continue;
      }

      if (fx.skillId === 'iron_will') {
        this.drawIronWill(ctx, fx, camera, now, duration);
        continue;
      }

      if (fx.skillId === 'charge') {
        this.drawCharge(ctx, fx, camera, now, duration);
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
    const z = zoomScale(camera);
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
      ctx.arc(tx, ty, (6 - i) * z, 0, Math.PI * 2);
      ctx.fill();
    }

    // Core orb
    const pulse = 1 + Math.sin(age * 0.03) * 0.15;
    const radius = 9 * pulse * z;
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
        this.drawMissPuff(ctx, end.x, end.y, impactAlpha, 'fire', z);
      } else {
        this.drawFireExplosion(ctx, end.x, end.y, impactAlpha, impactT, z);
      }
    }
  }

  drawIcebolt(ctx, fx, camera, now, duration) {
    const z = zoomScale(camera);
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
      ctx.arc(tx, ty, 3 * z, 0, Math.PI * 2);
      ctx.fill();
    }

    // Shard
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = 'rgba(220, 245, 255, 0.95)';
    ctx.strokeStyle = 'rgba(100, 180, 255, 0.9)';
    ctx.lineWidth = 1.5 * z;
    ctx.beginPath();
    ctx.moveTo(12 * z, 0);
    ctx.lineTo(-6 * z, -5 * z);
    ctx.lineTo(-4 * z, 0);
    ctx.lineTo(-6 * z, 5 * z);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    if (travelProgress >= 1) {
      const impactAge = age - travelEnd;
      const impactT = Math.min(1, impactAge / (duration - travelEnd + 100));
      const impactAlpha = 1 - impactT;

      if (fx.missed) {
        this.drawMissPuff(ctx, end.x, end.y, impactAlpha, 'ice', z);
      } else {
        this.drawIceShatter(ctx, end.x, end.y, impactAlpha, impactT, z);
      }
    }
  }

  drawFireExplosion(ctx, x, y, alpha, t, z = 1) {
    const radius = (8 + t * 22) * z;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(255, 240, 150, ${alpha * 0.9})`);
    gradient.addColorStop(0.4, `rgba(255, 120, 30, ${alpha * 0.6})`);
    gradient.addColorStop(1, 'rgba(200, 40, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  drawIceShatter(ctx, x, y, alpha, t, z = 1) {
    const radius = (6 + t * 18) * z;
    ctx.strokeStyle = `rgba(160, 220, 255, ${alpha})`;
    ctx.lineWidth = 2 * z;
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

  drawMissPuff(ctx, x, y, alpha, element, z = 1) {
    const isFire = element === 'fire';
    const color = isFire ? 'rgba(255, 160, 80' : 'rgba(160, 210, 255';
    const radius = (isFire ? 14 : 12) * z;

    ctx.strokeStyle = `${color}, ${alpha * 0.7})`;
    ctx.lineWidth = 2 * z;
    ctx.setLineDash([4 * z, 4 * z]);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = `${color}, ${alpha * 0.25})`;
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.55, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
    ctx.font = `${10 * z}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('Miss', x, y - radius - 4 * z);
  }

  drawMeleeArc(ctx, fx, camera, alpha) {
    const z = zoomScale(camera);
    const origin = camera.worldToScreen(fx.x, fx.y);
    const target = camera.worldToScreen(fx.targetX, fx.targetY);
    const angle = Math.atan2(target.y - origin.y, target.x - origin.x);

    ctx.save();
    ctx.translate(origin.x, origin.y);
    ctx.rotate(angle);
    ctx.fillStyle = `rgba(231, 76, 60, ${alpha * 0.35})`;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 48 * z, -Math.PI / 3, Math.PI / 3);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 200, 100, ${alpha})`;
    ctx.lineWidth = 2 * z;
    ctx.stroke();
    ctx.restore();

    if (fx.missed) {
      this.drawMissPuff(ctx, target.x, target.y, alpha * 0.8, 'fire', z);
    }
  }

  drawDash(ctx, fx, camera, alpha, progress) {
    const z = zoomScale(camera);
    const start = camera.worldToScreen(fx.x, fx.y);
    const end = camera.worldToScreen(fx.targetX, fx.targetY);
    const x = start.x + (end.x - start.x) * progress;
    const y = start.y + (end.y - start.y) * progress;

    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 3 * z;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    ctx.fillStyle = `rgba(231, 76, 60, ${alpha * 0.5})`;
    ctx.beginPath();
    ctx.arc(x, y, 14 * z, 0, Math.PI * 2);
    ctx.fill();
  }

  drawGenericProjectile(ctx, fx, camera, alpha, progress) {
    const z = zoomScale(camera);
    const start = camera.worldToScreen(fx.x, fx.y);
    const end = camera.worldToScreen(fx.impactX, fx.impactY);
    const x = start.x + (end.x - start.x) * progress;
    const y = start.y + (end.y - start.y) * progress;

    ctx.fillStyle = `rgba(46, 204, 113, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, 5 * z, 0, Math.PI * 2);
    ctx.fill();

    if (progress >= 0.95 && fx.missed) {
      this.drawMissPuff(ctx, end.x, end.y, alpha, 'ice', z);
    }
  }

  drawGroundAoE(ctx, fx, skill, camera, alpha, progress) {
    const z = zoomScale(camera);
    const cx = skill.range ? (fx.targetX ?? fx.impactX ?? fx.x) : fx.x;
    const cy = skill.range ? (fx.targetY ?? fx.impactY ?? fx.y) : fx.y;
    if (!Number.isFinite(cx) || !Number.isFinite(cy)) return;

    const center = camera.worldToScreen(cx, cy);
    const radius = (skill.radius ?? 40) * z * (0.5 + progress * 0.5);

    ctx.fillStyle = `rgba(39, 174, 96, ${alpha * 0.35})`;
    ctx.strokeStyle = `rgba(39, 174, 96, ${alpha})`;
    ctx.lineWidth = 2 * z;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (fx.missed) {
      this.drawMissPuff(ctx, center.x, center.y, alpha * 0.7, 'ice', z);
    }
  }

  drawChainSpark(ctx, fx, camera, now, duration) {
    const z = zoomScale(camera);
    const age = Math.max(0, now - fx.at);
    const start = camera.worldToScreen(fx.x, fx.y);
    const end = camera.worldToScreen(fx.impactX ?? fx.targetX, fx.impactY ?? fx.targetY);
    const travelEnd = duration * 0.55;
    const travelProgress = Math.min(1, age / travelEnd);

    this.drawLightningBolt(ctx, start, end, travelProgress, z, fx.at);

    if (travelProgress >= 1) {
      const impactAge = age - travelEnd;
      const impactT = Math.min(1, impactAge / (duration - travelEnd + 100));
      const impactAlpha = 1 - impactT;
      this.drawElectricBurst(ctx, end.x, end.y, impactAlpha, impactT, z);
    }
  }

  drawLightningBolt(ctx, start, end, travelProgress, z, seed = 0) {
    const segments = 6;
    const points = [{ x: start.x, y: start.y }];

    for (let i = 1; i < segments; i++) {
      const t = (i / segments) * travelProgress;
      if (t <= 0) continue;
      const baseX = start.x + (end.x - start.x) * t;
      const baseY = start.y + (end.y - start.y) * t;
      const jitter = (1 - t) * 14 * z;
      const phase = seed * 0.01 + i * 1.7;
      points.push({
        x: baseX + Math.sin(phase) * jitter,
        y: baseY + Math.cos(phase * 1.3) * jitter,
      });
    }

    if (travelProgress >= 1) {
      points.push({ x: end.x, y: end.y });
    } else if (points.length > 1) {
      const tipT = travelProgress;
      points.push({
        x: start.x + (end.x - start.x) * tipT,
        y: start.y + (end.y - start.y) * tipT,
      });
    }

    if (points.length < 2) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(120, 200, 255, 0.9)';
    ctx.shadowBlur = 8 * z;

    ctx.strokeStyle = 'rgba(180, 230, 255, 0.35)';
    ctx.lineWidth = 7 * z;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(240, 250, 255, 0.95)';
    ctx.lineWidth = 2.5 * z;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
    ctx.restore();
  }

  drawElectricBurst(ctx, x, y, alpha, t, z = 1) {
    const radius = (10 + t * 28) * z;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(220, 245, 255, ${alpha * 0.95})`);
    gradient.addColorStop(0.35, `rgba(100, 180, 255, ${alpha * 0.65})`);
    gradient.addColorStop(1, 'rgba(60, 120, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 5; i++) {
      const a = (Math.PI * 2 * i) / 5 + t * 2;
      const len = radius * (0.7 + Math.sin(t * 10 + i) * 0.15);
      ctx.strokeStyle = `rgba(200, 230, 255, ${alpha * 0.8})`;
      ctx.lineWidth = 1.5 * z;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
      ctx.stroke();
    }
  }

  drawMeteor(ctx, fx, camera, now, duration) {
    const z = zoomScale(camera);
    const age = Math.max(0, now - fx.at);
    const end = camera.worldToScreen(fx.impactX ?? fx.targetX, fx.impactY ?? fx.targetY);
    const fallEnd = duration * 0.62;
    const fallProgress = Math.min(1, age / fallEnd);
    const startYOffset = 90 * z;
    const x = end.x + (1 - fallProgress) * 12 * z;
    const y = end.y - startYOffset * (1 - fallProgress);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    const size = (8 + fallProgress * 6) * z;
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 1.4);
    gradient.addColorStop(0, 'rgba(255, 240, 180, 0.95)');
    gradient.addColorStop(0.5, 'rgba(255, 120, 40, 0.9)');
    gradient.addColorStop(1, 'rgba(120, 30, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(-size * 0.5, -size * 0.5, size, size);
    ctx.restore();

    if (fallProgress > 0.15) {
      ctx.strokeStyle = `rgba(255, 160, 60, ${0.45 * fallProgress})`;
      ctx.lineWidth = 3 * z;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(end.x, end.y - 8 * z);
      ctx.stroke();
    }

    if (fallProgress >= 1) {
      const impactAge = age - fallEnd;
      const impactT = Math.min(1, impactAge / (duration - fallEnd + 120));
      this.drawFireExplosion(ctx, end.x, end.y, 1 - impactT, impactT, z);
    }
  }

  drawMultishot(ctx, fx, camera, now, duration) {
    const z = zoomScale(camera);
    const age = Math.max(0, now - fx.at);
    const progress = Math.min(1, age / duration);
    const alpha = 1 - progress;
    const start = camera.worldToScreen(fx.x, fx.y);
    const end = camera.worldToScreen(fx.impactX ?? fx.targetX, fx.impactY ?? fx.targetY);
    const spread = 0.22;

    for (let i = -2; i <= 2; i++) {
      const offset = i * spread;
      const ex = end.x + (end.x - start.x) * offset;
      const ey = end.y + (end.y - start.y) * offset;
      const x = start.x + (ex - start.x) * progress;
      const y = start.y + (ey - start.y) * progress;
      const angle = Math.atan2(ey - start.y, ex - start.x);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = `rgba(220, 235, 255, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(10 * z, 0);
      ctx.lineTo(-5 * z, -3 * z);
      ctx.lineTo(-3 * z, 0);
      ctx.lineTo(-5 * z, 3 * z);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    if (progress >= 0.85) {
      const center = camera.worldToScreen(fx.impactX ?? fx.targetX, fx.impactY ?? fx.targetY);
      const burstAlpha = (1 - (progress - 0.85) / 0.15) * alpha;
      ctx.fillStyle = `rgba(180, 210, 255, ${burstAlpha * 0.35})`;
      ctx.beginPath();
      ctx.arc(center.x, center.y, 22 * z, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawFrostNova(ctx, fx, camera, now, duration) {
    const z = zoomScale(camera);
    const age = Math.max(0, now - fx.at);
    const progress = Math.min(1, age / duration);
    const alpha = 1 - progress;
    const center = camera.worldToScreen(fx.x, fx.y);
    const radius = (20 + progress * 56) * z;

    const gradient = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, radius);
    gradient.addColorStop(0, `rgba(220, 245, 255, ${alpha * 0.55})`);
    gradient.addColorStop(0.6, `rgba(120, 190, 255, ${alpha * 0.35})`);
    gradient.addColorStop(1, 'rgba(80, 140, 220, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(200, 235, 255, ${alpha * 0.9})`;
    ctx.lineWidth = 2 * z;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius * 0.75, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8;
      const len = radius * 0.55;
      ctx.beginPath();
      ctx.moveTo(center.x + Math.cos(a) * 8 * z, center.y + Math.sin(a) * 8 * z);
      ctx.lineTo(center.x + Math.cos(a) * len, center.y + Math.sin(a) * len);
      ctx.stroke();
    }
  }

  drawCleave(ctx, fx, camera, now, duration) {
    const z = zoomScale(camera);
    const age = Math.max(0, now - fx.at);
    const progress = Math.min(1, age / duration);
    const alpha = 1 - progress;
    const origin = camera.worldToScreen(fx.x, fx.y);
    const target = camera.worldToScreen(fx.targetX, fx.targetY);
    const angle = Math.atan2(target.y - origin.y, target.x - origin.x);
    const reach = (36 + progress * 20) * z;

    ctx.save();
    ctx.translate(origin.x, origin.y);
    ctx.rotate(angle);
    ctx.fillStyle = `rgba(231, 76, 60, ${alpha * 0.4})`;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, reach, -0.75, 0.75);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 210, 120, ${alpha})`;
    ctx.lineWidth = 3 * z;
    ctx.stroke();
    ctx.restore();

    if (fx.missed) {
      this.drawMissPuff(ctx, target.x, target.y, alpha * 0.8, 'fire', z);
    }
  }

  drawWhirlwind(ctx, fx, camera, now, duration) {
    const z = zoomScale(camera);
    const age = Math.max(0, now - fx.at);
    const progress = Math.min(1, age / duration);
    const alpha = 1 - progress;
    const center = camera.worldToScreen(fx.x, fx.y);
    const radius = (24 + progress * 40) * z;
    const spin = progress * Math.PI * 4;

    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.rotate(spin);
    for (let i = 0; i < 4; i++) {
      const a = (Math.PI * i) / 2;
      ctx.strokeStyle = `rgba(220, 220, 230, ${alpha * 0.9})`;
      ctx.lineWidth = 3 * z;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 8 * z, Math.sin(a) * 8 * z);
      ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
      ctx.stroke();
    }
    ctx.restore();

    ctx.strokeStyle = `rgba(192, 57, 43, ${alpha * 0.7})`;
    ctx.lineWidth = 2 * z;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius * 0.85, spin, spin + Math.PI * 1.5);
    ctx.stroke();
  }

  drawShieldBash(ctx, fx, camera, now, duration) {
    const z = zoomScale(camera);
    const age = Math.max(0, now - fx.at);
    const progress = Math.min(1, age / duration);
    const alpha = 1 - progress;
    const start = camera.worldToScreen(fx.x, fx.y);
    const end = camera.worldToScreen(fx.impactX ?? fx.targetX, fx.impactY ?? fx.targetY);
    const x = start.x + (end.x - start.x) * Math.min(1, progress * 1.4);
    const y = start.y + (end.y - start.y) * Math.min(1, progress * 1.4);
    const size = (14 + progress * 10) * z;

    ctx.fillStyle = `rgba(189, 195, 199, ${alpha * 0.85})`;
    ctx.strokeStyle = `rgba(236, 240, 241, ${alpha})`;
    ctx.lineWidth = 2 * z;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (progress > 0.5) {
      const burstAlpha = (1 - (progress - 0.5) / 0.5) * alpha;
      ctx.strokeStyle = `rgba(255, 255, 255, ${burstAlpha})`;
      ctx.lineWidth = 2 * z;
      ctx.beginPath();
      ctx.arc(x, y, size * (1 + (progress - 0.5)), 0, Math.PI * 2);
      ctx.stroke();
    }

    if (fx.missed) {
      this.drawMissPuff(ctx, end.x, end.y, alpha * 0.8, 'ice', z);
    }
  }

  drawIronWill(ctx, fx, camera, now, duration) {
    const z = zoomScale(camera);
    const age = Math.max(0, now - fx.at);
    const progress = Math.min(1, age / duration);
    const alpha = 1 - progress;
    const center = camera.worldToScreen(fx.x, fx.y);
    const radius = (16 + progress * 36) * z;

    const gradient = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, radius);
    gradient.addColorStop(0, `rgba(255, 236, 179, ${alpha * 0.7})`);
    gradient.addColorStop(0.5, `rgba(241, 196, 15, ${alpha * 0.35})`);
    gradient.addColorStop(1, 'rgba(180, 140, 20, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(255, 248, 220, ${alpha * 0.9})`;
    ctx.lineWidth = 2 * z;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius * 0.6, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawCharge(ctx, fx, camera, now, duration) {
    const z = zoomScale(camera);
    const age = Math.max(0, now - fx.at);
    const progress = Math.min(1, age / duration);
    const alpha = 1 - progress;
    const start = camera.worldToScreen(fx.x, fx.y);
    const end = camera.worldToScreen(fx.targetX, fx.targetY);
    const x = start.x + (end.x - start.x) * progress;
    const y = start.y + (end.y - start.y) * progress;

    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 3 * z;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    ctx.fillStyle = `rgba(231, 76, 60, ${alpha * 0.5})`;
    ctx.beginPath();
    ctx.arc(x, y, 14 * z, 0, Math.PI * 2);
    ctx.fill();

    if (progress > 0.75 && !fx.missed) {
      const sparkAlpha = (1 - (progress - 0.75) / 0.25) * alpha;
      ctx.strokeStyle = `rgba(255, 255, 200, ${sparkAlpha})`;
      ctx.lineWidth = 2 * z;
      for (let i = 0; i < 4; i++) {
        const a = (Math.PI * i) / 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(a) * 18 * z, y + Math.sin(a) * 18 * z);
        ctx.stroke();
      }
    }
  }
}
