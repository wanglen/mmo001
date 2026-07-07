import {
  PARTICLE_PRESETS,
  buildParticleBurst,
} from '/shared/plugins/render/particles.js';

/**
 * Lightweight canvas particle pool for combat and UI feedback.
 */
export class ParticleSystem {
  constructor() {
    /** @type {object[]} */
    this.particles = [];
    this.lastUpdateAt = 0;
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {keyof typeof PARTICLE_PRESETS} presetId
   */
  emitBurst(x, y, presetId) {
    const preset = PARTICLE_PRESETS[presetId];
    if (!preset) return;
    this.particles.push(...buildParticleBurst(preset, x, y));
  }

  /** @param {number} timestamp */
  update(timestamp) {
    const dtMs = this.lastUpdateAt ? timestamp - this.lastUpdateAt : 16;
    this.lastUpdateAt = timestamp;
    const dt = Math.min(dtMs, 48) / 1000;

    for (const particle of this.particles) {
      particle.vy += particle.gravity * dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.life -= dtMs;
    }

    this.particles = this.particles.filter((particle) => particle.life > 0);
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {import('../core/Camera.js').Camera} camera
   */
  draw(ctx, camera) {
    const zoom = camera.zoom ?? 1;

    for (const particle of this.particles) {
      const alpha = Math.max(0, Math.min(1, particle.life / particle.maxLife));
      const screen = camera.worldToScreen(particle.x, particle.y);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, particle.size * zoom, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  clear() {
    this.particles = [];
    this.lastUpdateAt = 0;
  }
}
