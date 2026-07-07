import { resolvePlayerMeleeDamage, resolveMonsterHitOnPlayer } from './advancedCombat.js';

export const ATTACK_RANGE = 52;
export const ATTACK_COOLDOWN_MS = 600;
export const ATTACK_ANIM_MS = 250;
/** Server accepts attacks slightly beyond client range to account for movement lag. */
export const ATTACK_RANGE_LEEWAY = 8;
export const MONSTER_HIT_RADIUS = 24;
/** Extra padding added to projectile ray hit tests (monster body + aim forgiveness). */
export const PROJECTILE_HIT_PADDING = 22;
/** Ground-click radius for single-target skills (e.g. arrow shot). */
export const SKILL_AIM_RADIUS = 28;
export const MONSTER_ATTACK_COOLDOWN_MS = 1200;
/** Provoked monsters chase their attacker up to this distance. */
export const MONSTER_PROVOKE_CHASE_RANGE = 600;

export function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

export function calculateDamage(attackerStr, defenderVit = 0, options = {}) {
  const { damage } = resolvePlayerMeleeDamage({
    str: attackerStr,
    dex: options.dex ?? 0,
    defenderVit,
    damageType: options.damageType ?? 'physical',
    defenderResistances: options.defenderResistances ?? {},
    damagePercent: options.damagePercent ?? 0,
    random: options.random,
  });
  return damage;
}

export function calculateMonsterDamage(baseDamage, defenderVit = 0, options = {}) {
  const { damage } = resolveMonsterHitOnPlayer({
    baseDamage,
    damageType: options.damageType ?? 'physical',
    defenderDex: options.defenderDex ?? 0,
    defenderVit,
    defenderResistances: options.defenderResistances ?? {},
    random: options.random,
  });
  return damage;
}

export function isInRange(x1, y1, x2, y2, range = ATTACK_RANGE) {
  return distance(x1, y1, x2, y2) <= range;
}

/** Melee attack validation — optional leeway for server-side lag forgiveness. */
export function isInAttackRange(x1, y1, x2, y2, leeway = 0) {
  return isInRange(x1, y1, x2, y2, ATTACK_RANGE + leeway);
}

export function canAttackNow(lastAttackAt, now = Date.now(), cooldownMs = ATTACK_COOLDOWN_MS) {
  return now - lastAttackAt >= cooldownMs;
}

export { resolvePlayerMeleeDamage, resolveMonsterHitOnPlayer } from './advancedCombat.js';
export { DAMAGE_TYPE, createEmptyResistances } from './damageTypes.js';
export { STATUS, isStunned, getMovementSpeedMultiplier, tickStatusEffects, applyStatusEffect, createStatusEffect, clearStatusEffects } from './statusEffects.js';
export { ELITE_MODIFIERS, rollEliteModifier, applyEliteModifier } from './eliteModifiers.js';
export { getBossPhase, getBossDamageMultiplier, getBossAttackCooldown } from './bossPhases.js';

export function findMonsterAt(monsters, x, y, radius = MONSTER_HIT_RADIUS) {
  let best = null;
  let bestDist = radius;

  for (const monster of monsters) {
    if (monster.hp <= 0) continue;
    const d = distance(x, y, monster.x, monster.y);
    if (d <= bestDist) {
      best = monster;
      bestDist = d;
    }
  }

  return best;
}

export function findNearestMonsterInRange(player, monsters, range = ATTACK_RANGE) {
  let best = null;
  let bestDist = range;

  for (const monster of monsters) {
    if (monster.hp <= 0) continue;
    const d = distance(player.x, player.y, monster.x, monster.y);
    if (d <= bestDist) {
      best = monster;
      bestDist = d;
    }
  }

  return best;
}
