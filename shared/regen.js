/** MP restored per second while out of combat. */
export const MP_REGEN_PER_SEC = {
  warrior: 1,
  mage: 3.5,
  ranger: 1.75,
};

/** No MP regen for this long after attacking, casting, or taking damage. */
export const COMBAT_MP_REGEN_DELAY_MS = 3000;

/**
 * @param {object} player
 * @returns {number}
 */
export function getLastCombatAt(player) {
  return Math.max(
    player.lastSkillAt ?? 0,
    player.lastAttackAt ?? 0,
    player.lastDamagedAt ?? 0,
  );
}

/**
 * @param {object} player
 * @param {number} [now]
 */
export function isInCombat(player, now = Date.now()) {
  const last = getLastCombatAt(player);
  return last > 0 && now - last < COMBAT_MP_REGEN_DELAY_MS;
}

/**
 * Regenerate MP toward maxMp.
 * @param {object} stats - Player stats with mp, maxMp
 * @param {string} characterClass
 * @param {number} deltaSec - Elapsed seconds since last tick
 * @param {{ inCombat?: boolean }} [options]
 */
export function tickMpRegen(stats, characterClass, deltaSec, { inCombat = false } = {}) {
  if (inCombat || deltaSec <= 0) return 0;

  const rate = MP_REGEN_PER_SEC[characterClass] ?? MP_REGEN_PER_SEC.warrior;
  const maxMp = stats.maxMp ?? 0;
  const before = stats.mp ?? 0;

  if (before >= maxMp) return 0;

  const gain = rate * deltaSec;
  stats.mp = Math.min(maxMp, before + gain);
  return stats.mp - before;
}
