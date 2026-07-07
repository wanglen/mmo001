export const BOSS_PHASE_THRESHOLDS = [0.66, 0.33];

/**
 * @param {object} monster
 * @returns {1 | 2 | 3}
 */
export function getBossPhase(monster) {
  if (!monster?.isBoss || monster.maxHp <= 0) return 1;
  const ratio = monster.hp / monster.maxHp;
  if (ratio <= BOSS_PHASE_THRESHOLDS[1]) return 3;
  if (ratio <= BOSS_PHASE_THRESHOLDS[0]) return 2;
  return 1;
}

/** @param {object} monster */
export function getBossDamageMultiplier(monster) {
  const phase = getBossPhase(monster);
  if (phase === 3) return 1.3;
  if (phase === 2) return 1.1;
  return 1;
}

/**
 * @param {number} baseCooldownMs
 * @param {object} monster
 */
export function getBossAttackCooldown(baseCooldownMs, monster) {
  const phase = getBossPhase(monster);
  if (phase >= 2) return Math.floor(baseCooldownMs * 0.85);
  return baseCooldownMs;
}
