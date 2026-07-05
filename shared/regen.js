/** MP restored per second while out of combat (always active for now). */
export const MP_REGEN_PER_SEC = {
  warrior: 0.5,
  mage: 2.5,
  ranger: 1,
};

/**
 * Regenerate MP toward maxMp.
 * @param {object} stats - Player stats with mp, maxMp
 * @param {string} characterClass
 * @param {number} deltaSec - Elapsed seconds since last tick
 */
export function tickMpRegen(stats, characterClass, deltaSec) {
  if (deltaSec <= 0) return 0;

  const rate = MP_REGEN_PER_SEC[characterClass] ?? MP_REGEN_PER_SEC.warrior;
  const maxMp = stats.maxMp ?? 0;
  const before = stats.mp ?? 0;

  if (before >= maxMp) return 0;

  const gain = rate * deltaSec;
  stats.mp = Math.min(maxMp, before + gain);
  return stats.mp - before;
}
