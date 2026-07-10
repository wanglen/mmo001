/** Blood Necromancer summon templates and level-scaled thrall caps. */

export const SUMMON_TYPES = {
  blood_thrall: {
    id: 'blood_thrall',
    label: 'Blood Thrall',
    color: '#8b1a2b',
    speed: 1.35,
    aggroRange: 140,
    attackRange: 28,
    attackCooldownMs: 700,
    /** Fraction of owner VIT used for HP / damage. */
    vitHpMult: 4.5,
    vitDamageMult: 0.55,
    durationMs: 28000,
    slotCost: 1,
  },
  blood_shade: {
    id: 'blood_shade',
    label: 'Blood Shade',
    color: '#c0392b',
    speed: 1.85,
    aggroRange: 160,
    attackRange: 26,
    attackCooldownMs: 520,
    vitHpMult: 3.2,
    vitDamageMult: 0.48,
    durationMs: 22000,
    slotCost: 1,
  },
  blood_weak: {
    id: 'blood_weak',
    label: 'Blood Wisp',
    color: '#a93226',
    speed: 1.5,
    aggroRange: 120,
    attackRange: 24,
    attackCooldownMs: 650,
    vitHpMult: 2.4,
    vitDamageMult: 0.35,
    durationMs: 18000,
    slotCost: 1,
  },
};

/** Hard ceiling on concurrent thralls. */
export const MAX_SUMMON_SLOTS = 5;

/** Base cast range (px) for raising thralls at the cursor. */
export const SUMMON_CAST_RANGE_BASE = 96;
/** Extra cast range per level after 1. */
export const SUMMON_CAST_RANGE_PER_LEVEL = 4;
/** Cap on summon cast range. */
export const SUMMON_CAST_RANGE_MAX = 220;

/**
 * Level-scaled summon slot cap: 1 at L1–4, +1 every 5 levels, max 5.
 * @param {number} level
 * @returns {number}
 */
export function getMaxSummonSlots(level) {
  const lvl = Math.max(1, Math.floor(Number(level) || 1));
  return Math.min(MAX_SUMMON_SLOTS, 1 + Math.floor((lvl - 1) / 5));
}

/**
 * Max distance from caster to raise thralls at the cursor.
 * @param {number} level
 * @returns {number}
 */
export function getSummonCastRange(level) {
  const lvl = Math.max(1, Math.floor(Number(level) || 1));
  return Math.min(
    SUMMON_CAST_RANGE_MAX,
    SUMMON_CAST_RANGE_BASE + (lvl - 1) * SUMMON_CAST_RANGE_PER_LEVEL
  );
}

/**
 * @param {string} summonType
 * @returns {typeof SUMMON_TYPES[keyof typeof SUMMON_TYPES] | null}
 */
export function getSummonDef(summonType) {
  return SUMMON_TYPES[summonType] ?? null;
}

/**
 * Build combat stats for a thrall from owner VIT + level.
 * @param {object} def
 * @param {{ vit?: number, level?: number }} owner
 */
export function scaleSummonStats(def, owner) {
  const vit = Math.max(1, Number(owner?.vit) || 1);
  const level = Math.max(1, Math.floor(Number(owner?.level) || 1));
  const levelBonus = 1 + (level - 1) * 0.04;
  const hp = Math.max(12, Math.floor(vit * def.vitHpMult * levelBonus));
  const damage = Math.max(2, Math.floor(vit * def.vitDamageMult * levelBonus));
  return { hp, damage };
}

/**
 * Sum slot costs of living summons owned by player.
 * @param {object[]} summons
 * @param {string} ownerId
 */
export function countOwnedSummonSlots(summons, ownerId) {
  let slots = 0;
  for (const summon of summons) {
    if (!summon?.isSummon || summon.ownerId !== ownerId || summon.hp <= 0) continue;
    slots += summon.slotCost ?? 1;
  }
  return slots;
}

/**
 * Oldest-first summon ids to remove so `neededSlots` fit under `maxSlots`.
 * @param {object[]} ownedSummons living summons for owner (any order)
 * @param {number} neededSlots
 * @param {number} maxSlots
 * @returns {string[]}
 */
export function pickSummonsToReplace(ownedSummons, neededSlots, maxSlots) {
  const living = ownedSummons
    .filter((s) => s?.hp > 0)
    .slice()
    .sort((a, b) => (a.spawnedAt ?? 0) - (b.spawnedAt ?? 0));

  let used = living.reduce((sum, s) => sum + (s.slotCost ?? 1), 0);
  const removeIds = [];
  for (const summon of living) {
    if (used + neededSlots <= maxSlots) break;
    removeIds.push(summon.id);
    used -= summon.slotCost ?? 1;
  }
  return removeIds;
}
