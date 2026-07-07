/** @typedef {'blood' | 'levelUp' | 'spellFire' | 'spellIce' | 'spellArcane' | 'slash'} ParticlePresetId */

/** @type {Record<ParticlePresetId, object>} */
export const PARTICLE_PRESETS = {
  blood: {
    count: 10,
    speedMin: 40,
    speedMax: 140,
    lifeMin: 280,
    lifeMax: 520,
    sizeMin: 2,
    sizeMax: 4.5,
    gravity: 220,
    colors: ['#6b1010', '#a31818', '#cc3333'],
  },
  levelUp: {
    count: 28,
    speedMin: 30,
    speedMax: 110,
    lifeMin: 500,
    lifeMax: 900,
    sizeMin: 2,
    sizeMax: 5,
    gravity: -40,
    upward: true,
    colors: ['#ffd56a', '#ffeaa8', '#ffffff', '#ffaa44'],
  },
  spellFire: {
    count: 16,
    speedMin: 50,
    speedMax: 160,
    lifeMin: 250,
    lifeMax: 450,
    sizeMin: 2,
    sizeMax: 5,
    gravity: 30,
    colors: ['#ff6622', '#ff9933', '#ffcc55'],
  },
  spellIce: {
    count: 14,
    speedMin: 40,
    speedMax: 130,
    lifeMin: 300,
    lifeMax: 500,
    sizeMin: 2,
    sizeMax: 4,
    gravity: 20,
    colors: ['#88ddff', '#aaeeff', '#ffffff'],
  },
  spellArcane: {
    count: 12,
    speedMin: 45,
    speedMax: 150,
    lifeMin: 280,
    lifeMax: 480,
    sizeMin: 2,
    sizeMax: 4.5,
    gravity: 10,
    colors: ['#b388ff', '#7c4dff', '#e1bee7'],
  },
  slash: {
    count: 8,
    speedMin: 60,
    speedMax: 180,
    lifeMin: 180,
    lifeMax: 320,
    sizeMin: 1.5,
    sizeMax: 3.5,
    gravity: 80,
    colors: ['#ffffff', '#ffeedd', '#ff8866'],
  },
};

/**
 * @param {number} min
 * @param {number} max
 * @param {() => number} random
 */
export function randomInRange(min, max, random) {
  return min + (max - min) * random();
}

/**
 * @param {string[]} colors
 * @param {() => number} random
 */
export function pickColor(colors, random) {
  return colors[Math.floor(random() * colors.length)] ?? colors[0];
}

/**
 * @param {object} preset
 * @param {number} x
 * @param {number} y
 * @param {() => number} [random]
 */
export function buildParticleBurst(preset, x, y, random = Math.random) {
  const count = preset.count ?? 8;
  const particles = [];

  for (let i = 0; i < count; i += 1) {
    const angle = random() * Math.PI * 2;
    const speed = randomInRange(preset.speedMin, preset.speedMax, random);
    const life = randomInRange(preset.lifeMin, preset.lifeMax, random);
    const upward = preset.upward ? randomInRange(20, 90, random) : 0;

    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - upward,
      life,
      maxLife: life,
      size: randomInRange(preset.sizeMin, preset.sizeMax, random),
      color: pickColor(preset.colors, random),
      gravity: preset.gravity ?? 0,
    });
  }

  return particles;
}

/**
 * @param {string} skillId
 * @returns {ParticlePresetId}
 */
export function skillParticlePreset(skillId) {
  const id = skillId ?? '';
  if (id.includes('frost') || id.includes('ice')) return 'spellIce';
  if (id.includes('fire') || id.includes('meteor')) return 'spellFire';
  if (
    id.includes('cleave') ||
    id.includes('whirlwind') ||
    id.includes('shield_bash') ||
    id.includes('charge')
  ) {
    return 'slash';
  }
  return 'spellArcane';
}
