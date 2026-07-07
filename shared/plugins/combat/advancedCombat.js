import { getResistance } from './damageTypes.js';

export const CRIT_BASE_CHANCE = 0.05;
export const CRIT_DEX_BONUS = 0.005;
export const CRIT_MULTIPLIER = 1.5;
export const DODGE_DEX_FACTOR = 0.003;
export const MAX_RESISTANCE_PERCENT = 75;

/**
 * @param {number} dex
 * @param {() => number} [random]
 */
export function getCritChance(dex) {
  return Math.min(0.5, CRIT_BASE_CHANCE + dex * CRIT_DEX_BONUS);
}

/**
 * @param {number} dex
 * @param {() => number} [random]
 */
export function getDodgeChance(dex) {
  return Math.min(0.4, dex * DODGE_DEX_FACTOR);
}

/** @param {number} damage @param {number} resistancePercent */
export function applyResistance(damage, resistancePercent) {
  const capped = Math.min(MAX_RESISTANCE_PERCENT, Math.max(0, resistancePercent));
  return Math.max(1, Math.floor(damage * (1 - capped / 100)));
}

/**
 * @param {object} options
 * @param {number} options.str
 * @param {number} [options.dex]
 * @param {number} [options.defenderVit]
 * @param {string} [options.damageType]
 * @param {Record<string, number>} [options.defenderResistances]
 * @param {() => number} [options.random]
 */
export function resolvePlayerMeleeDamage({
  str,
  dex = 0,
  defenderVit = 0,
  damageType = 'physical',
  defenderResistances = {},
  random = Math.random,
}) {
  const base = Math.max(1, str * 2 - Math.floor(defenderVit * 0.5));
  const variance = Math.floor(random() * 3);
  let damage = base + variance;

  const crit = random() < getCritChance(dex);
  if (crit) damage = Math.floor(damage * CRIT_MULTIPLIER);

  const resistance = getResistance(defenderResistances, damageType);
  damage = applyResistance(damage, resistance);

  return { damage, crit };
}

/**
 * @param {object} options
 * @param {number} options.baseDamage
 * @param {string} [options.damageType]
 * @param {number} [options.defenderDex]
 * @param {number} [options.defenderVit]
 * @param {Record<string, number>} [options.defenderResistances]
 * @param {() => number} [options.random]
 */
export function resolveMonsterHitOnPlayer({
  baseDamage,
  damageType = 'physical',
  defenderDex = 0,
  defenderVit = 0,
  defenderResistances = {},
  random = Math.random,
}) {
  if (random() < getDodgeChance(defenderDex)) {
    return { damage: 0, dodged: true, crit: false };
  }

  const base = Math.max(1, baseDamage - Math.floor(defenderVit * 0.25));
  const variance = Math.floor(random() * 2);
  let damage = base + variance;

  const resistance = getResistance(defenderResistances, damageType);
  damage = applyResistance(damage, resistance);

  return { damage, dodged: false, crit: false };
}
