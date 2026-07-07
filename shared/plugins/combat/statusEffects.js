export const STATUS = {
  STUN: 'stun',
  SLOW: 'slow',
  POISON: 'poison',
  BLEED: 'bleed',
};

const DEFAULT_DURATIONS = {
  [STATUS.STUN]: 1200,
  [STATUS.SLOW]: 4000,
  [STATUS.POISON]: 5000,
  [STATUS.BLEED]: 4000,
};

const DOT_DAMAGE_PER_TICK = {
  [STATUS.POISON]: 2,
  [STATUS.BLEED]: 3,
};

const SLOW_SPEED_MULTIPLIER = 0.5;
const TICK_INTERVAL_MS = 1000;

/**
 * @param {string} type
 * @param {object} [options]
 * @param {number} [options.durationMs]
 * @param {number} [options.damagePerTick]
 * @param {string} [options.sourceId]
 */
export function createStatusEffect(type, options = {}) {
  const durationMs = options.durationMs ?? DEFAULT_DURATIONS[type] ?? 2000;
  const now = options.now ?? Date.now();
  return {
    type,
    sourceId: options.sourceId ?? null,
    expiresAt: now + durationMs,
    damagePerTick: options.damagePerTick ?? DOT_DAMAGE_PER_TICK[type] ?? 0,
    lastTickAt: now,
  };
}

/** @param {object} entity */
export function ensureStatusEffects(entity) {
  if (!Array.isArray(entity.statusEffects)) {
    entity.statusEffects = [];
  }
  return entity.statusEffects;
}

/** @param {object} entity @param {object} effect */
export function applyStatusEffect(entity, effect) {
  const list = ensureStatusEffects(entity);
  const existing = list.findIndex((entry) => entry.type === effect.type);
  if (existing >= 0) {
    list[existing] = effect;
  } else {
    list.push(effect);
  }
}

/** @param {object} entity @param {number} [now] */
export function isStunned(entity, now = Date.now()) {
  return ensureStatusEffects(entity).some(
    (effect) => effect.type === STATUS.STUN && effect.expiresAt > now
  );
}

/** @param {object} entity @param {number} [now] */
export function getMovementSpeedMultiplier(entity, now = Date.now()) {
  const slowed = ensureStatusEffects(entity).some(
    (effect) => effect.type === STATUS.SLOW && effect.expiresAt > now
  );
  return slowed ? SLOW_SPEED_MULTIPLIER : 1;
}

/**
 * Advance DoT timers and remove expired effects.
 * @returns {number} damage dealt this tick
 */
export function tickStatusEffects(entity, now = Date.now()) {
  const list = ensureStatusEffects(entity);
  let damage = 0;

  for (let i = list.length - 1; i >= 0; i--) {
    const effect = list[i];
    if (effect.expiresAt <= now) {
      list.splice(i, 1);
      continue;
    }

    if (effect.damagePerTick > 0 && now - (effect.lastTickAt ?? 0) >= TICK_INTERVAL_MS) {
      damage += effect.damagePerTick;
      effect.lastTickAt = now;
    }
  }

  return damage;
}

/** @param {object} entity */
export function clearStatusEffects(entity) {
  entity.statusEffects = [];
}
