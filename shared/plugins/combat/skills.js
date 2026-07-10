import skillsData from '../../content/skills.json' with { type: 'json' };
import { distance, MONSTER_HIT_RADIUS, PROJECTILE_HIT_PADDING } from './combat.js';
import { getCritChance, CRIT_MULTIPLIER } from './advancedCombat.js';

export const SKILL_SLOT_COUNT = skillsData.skillSlotCount;
/** Scales skill damage down so early skills do not one-shot common mobs. */
export const SKILL_DAMAGE_SCALAR = 0.72;

/** @typedef {'melee_aoe' | 'dash' | 'projectile' | 'ground_aoe' | 'single_target' | 'summon' | 'sacrifice' | 'summon_heal'} SkillType */

/**
 * @typedef {object} SkillDef
 * @property {string} id
 * @property {string} name
 * @property {string} [description]
 * @property {string} icon
 * @property {string[]} classes
 * @property {number} mpCost
 * @property {number} [hpCost]
 * @property {number} cooldownMs
 * @property {SkillType} type
 * @property {number} [range]
 * @property {number} [radius]
 * @property {number} [dashDistance]
 * @property {'arc' | 'spin' | 'self_pulse'} [aoeShape]
 * @property {number} [arcHalfRad]
 * @property {string} [onHitStatus]
 * @property {number} [statusDurationMs]
 * @property {number} [selfHeal]
 * @property {string} [summonType]
 * @property {number} [summonCount]
 * @property {number} [healMult]
 * @property {number} [sacrificeDamageMult]
 * @property {'str' | 'dex' | 'int' | 'vit'} damageStat
 * @property {number} damageMult
 */

/** @type {Record<string, SkillDef>} */
export const SKILLS = skillsData.skills;

/** @type {Record<string, (string | null)[]>} */
export const CLASS_SKILL_BARS = skillsData.classSkillBars;

/**
 * @param {string} characterClass
 * @returns {(SkillDef | null)[]}
 */
export function getSkillBar(characterClass) {
  const ids = CLASS_SKILL_BARS[characterClass] ?? CLASS_SKILL_BARS.warrior;
  return ids.map((id) => (id ? SKILLS[id] : null));
}

/**
 * @param {string} skillId
 * @returns {SkillDef | null}
 */
export function getSkill(skillId) {
  return SKILLS[skillId] ?? null;
}

/**
 * @param {string} characterClass
 * @param {number} slotIndex
 * @returns {string | null}
 */
export function getSkillIdAtSlot(characterClass, slotIndex) {
  const bar = CLASS_SKILL_BARS[characterClass] ?? CLASS_SKILL_BARS.warrior;
  if (slotIndex < 0 || slotIndex >= SKILL_SLOT_COUNT) return null;
  return bar[slotIndex] ?? null;
}

/**
 * Whole MP available for skill costs (regen may store fractional values).
 * @param {object} player
 */
export function getAvailableMp(player) {
  const mp = Number(player?.mp);
  if (!Number.isFinite(mp)) return 0;
  return Math.max(0, Math.floor(mp));
}

/**
 * Spendable HP for blood skills — always leave at least 1 HP.
 * @param {object} player
 */
export function getAvailableHpForSkills(player) {
  const hp = Number(player?.hp);
  if (!Number.isFinite(hp)) return 0;
  return Math.max(0, Math.floor(hp) - 1);
}

/**
 * @param {SkillDef | null | undefined} skill
 * @returns {number}
 */
export function getSkillHpCost(skill) {
  const cost = Number(skill?.hpCost);
  if (!Number.isFinite(cost) || cost <= 0) return 0;
  return Math.floor(cost);
}

/**
 * @param {object} player
 * @param {number} mpCost
 */
export function spendSkillMp(player, mpCost) {
  const available = getAvailableMp(player);
  player.mp = Math.max(0, available - mpCost);
}

/**
 * Spend HP for a skill cost, never dropping below 1.
 * @param {object} player
 * @param {number} hpCost
 */
export function spendSkillHp(player, hpCost) {
  const cost = Math.max(0, Math.floor(Number(hpCost) || 0));
  if (cost <= 0) return 0;
  const before = Math.max(0, Math.floor(Number(player.hp) || 0));
  player.hp = Math.max(1, before - cost);
  return before - player.hp;
}

/**
 * Resource label for skill bar / tooltips.
 * @param {SkillDef} skill
 * @returns {{ amount: number, unit: 'HP' | 'MP' }}
 */
export function getSkillResourceCost(skill) {
  const hpCost = getSkillHpCost(skill);
  if (hpCost > 0) return { amount: hpCost, unit: 'HP' };
  return { amount: skill?.mpCost ?? 0, unit: 'MP' };
}

/**
 * Remaining cooldown for one skill. Server stores last-cast timestamps; synced
 * client state stores remaining ms from serialize.
 * @param {object} player
 * @param {string} skillId
 * @param {number} [now]
 */
export function getSkillCooldownRemainingMs(player, skillId, now = Date.now()) {
  const skill = getSkill(skillId);
  if (!skill) return 0;

  const stored = player.skillCooldowns?.[skillId] ?? 0;
  if (!stored) return 0;

  // Synced world state: remaining ms (never above cooldownMs while active).
  if (stored <= skill.cooldownMs) return stored;

  return Math.max(0, skill.cooldownMs - (now - stored));
}

/**
 * @param {object} player
 * @param {string} skillId
 * @param {number} [now]
 * @returns {{ ok: true } | { ok: false, reason: string }}
 */
export function canUseSkill(player, skillId, now = Date.now()) {
  const skill = getSkill(skillId);
  if (!skill) return { ok: false, reason: 'invalid_skill' };
  if (!skill.classes.includes(player.characterClass)) {
    return { ok: false, reason: 'wrong_class' };
  }

  const unlocked = player.unlockedSkills;
  if (Array.isArray(unlocked) && !unlocked.includes(skillId)) {
    return { ok: false, reason: 'not_unlocked' };
  }

  const hpCost = getSkillHpCost(skill);
  if (hpCost > 0 && getAvailableHpForSkills(player) < hpCost) {
    return { ok: false, reason: 'no_hp' };
  }
  if ((skill.mpCost ?? 0) > 0 && getAvailableMp(player) < skill.mpCost) {
    return { ok: false, reason: 'no_mp' };
  }

  if (getSkillCooldownRemainingMs(player, skillId, now) > 0) {
    return { ok: false, reason: 'cooldown' };
  }

  return { ok: true };
}

/**
 * @param {object} player
 * @param {number} [now]
 * @returns {Record<string, number>}
 */
export function getSkillCooldownRemaining(player, now = Date.now()) {
  const bar =
    Array.isArray(player.skillBarSlots) && player.skillBarSlots.length > 0
      ? player.skillBarSlots
      : CLASS_SKILL_BARS[player.characterClass] ?? [];
  const remaining = {};

  for (const skillId of bar) {
    if (!skillId) continue;
    remaining[skillId] = getSkillCooldownRemainingMs(player, skillId, now);
  }

  return remaining;
}

/**
 * Skill damage range before variance and crit.
 * @param {SkillDef} skill
 * @param {object} combatStats
 */
export function getSkillDamageBounds(skill, combatStats) {
  const stat = combatStats[skill.damageStat] ?? 5;
  const base = Math.max(1, Math.floor(stat * skill.damageMult * SKILL_DAMAGE_SCALAR));
  const applyPercent = (value) => {
    const damagePercent = combatStats.damagePercent ?? 0;
    if (damagePercent <= 0) return value;
    return Math.floor(value * (1 + damagePercent / 100));
  };

  const min = applyPercent(base);
  const max = applyPercent(base + 2);
  return {
    min,
    max,
    critMin: applyPercent(Math.floor(base * CRIT_MULTIPLIER)),
    critMax: applyPercent(Math.floor((base + 2) * CRIT_MULTIPLIER)),
  };
}

/**
 * @param {SkillDef} skill
 * @param {object} combatStats
 * @param {() => number} [random]
 * @returns {{ damage: number, crit: boolean }}
 */
export function resolveSkillDamage(skill, combatStats, random = Math.random) {
  const stat = combatStats[skill.damageStat] ?? 5;
  let damage = Math.max(1, Math.floor(stat * skill.damageMult * SKILL_DAMAGE_SCALAR));
  damage += Math.floor(random() * 3);

  const damagePercent = combatStats.damagePercent ?? 0;
  if (damagePercent > 0) {
    damage = Math.floor(damage * (1 + damagePercent / 100));
  }

  const dex = combatStats.dex ?? 0;
  const crit = random() < getCritChance(dex);
  if (crit) damage = Math.floor(damage * CRIT_MULTIPLIER);

  return { damage, crit };
}

/**
 * @param {SkillDef} skill
 * @param {object} combatStats
 * @returns {number}
 */
export function calculateSkillDamage(skill, combatStats) {
  return resolveSkillDamage(skill, combatStats).damage;
}

/**
 * @param {object[]} monsters
 * @param {number} cx
 * @param {number} cy
 * @param {number} radius
 * @returns {object[]}
 */
export function findMonstersInRadius(monsters, cx, cy, radius) {
  const hits = [];
  for (const monster of monsters) {
    if (monster.hp <= 0) continue;
    if (distance(cx, cy, monster.x, monster.y) <= radius) {
      hits.push(monster);
    }
  }
  return hits;
}

/**
 * Melee arc toward aim point.
 * @param {object[]} monsters
 * @param {number} px
 * @param {number} py
 * @param {number} aimX
 * @param {number} aimY
 * @param {number} range
 * @param {number} [arcHalfRad]
 * @returns {object[]}
 */
export function findMonstersInArc(monsters, px, py, aimX, aimY, range, arcHalfRad = Math.PI / 2) {
  const dx = aimX - px;
  const dy = aimY - py;
  const aimLen = Math.hypot(dx, dy);
  if (aimLen < 1) return [];

  const aimAngle = Math.atan2(dy, dx);
  const hits = [];

  for (const monster of monsters) {
    if (monster.hp <= 0) continue;
    const mx = monster.x - px;
    const my = monster.y - py;
    const dist = Math.hypot(mx, my);
    if (dist > range) continue;

    const angle = Math.atan2(my, mx);
    let diff = angle - aimAngle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    if (Math.abs(diff) <= arcHalfRad) hits.push(monster);
  }

  return hits;
}

/**
 * Melee hit resolution — arc (default), spin (360°), or self_pulse (centered on caster).
 * @param {SkillDef} skill
 * @param {object} player
 * @param {object[]} monsters
 * @param {number} aimX
 * @param {number} aimY
 * @returns {object[]}
 */
export function resolveMeleeHits(skill, player, monsters, aimX, aimY) {
  const shape = skill.aoeShape ?? 'arc';

  if (shape === 'spin' || shape === 'self_pulse') {
    return findMonstersInRadius(monsters, player.x, player.y, skill.radius ?? 48);
  }

  const arcHalfRad = skill.arcHalfRad ?? Math.PI / 2;
  const range = skill.range ?? 52;
  return findMonstersInArc(monsters, player.x, player.y, aimX, aimY, range, arcHalfRad);
}

/**
 * Nearest monster to a ground point within radius (for projectiles).
 * @param {object[]} monsters
 * @param {number} px
 * @param {number} py
 * @param {number} tx
 * @param {number} ty
 * @param {number} maxRange
 * @param {number} hitRadius
 * @returns {object | null}
 */
export function findMonsterAtGroundPoint(monsters, px, py, tx, ty, maxRange, hitRadius) {
  if (distance(px, py, tx, ty) > maxRange) return null;

  let best = null;
  let bestDist = hitRadius;

  for (const monster of monsters) {
    if (monster.hp <= 0) continue;
    const d = distance(tx, ty, monster.x, monster.y);
    if (d <= bestDist) {
      best = monster;
      bestDist = d;
    }
  }

  return best;
}

/**
 * First monster struck along a ray from caster toward aim (clamped to maxRange).
 * @returns {{ monster: object | null, endX: number, endY: number }}
 */
export function findFirstMonsterOnRay(monsters, px, py, aimX, aimY, maxRange, hitRadius) {
  const { x: endX, y: endY } = clampToSkillRange(px, py, aimX, aimY, maxRange);
  const dx = endX - px;
  const dy = endY - py;
  const lenSq = dx * dx + dy * dy;
  const effectiveRadius = hitRadius + MONSTER_HIT_RADIUS + PROJECTILE_HIT_PADDING;

  if (lenSq < 1) {
    return { monster: null, endX, endY };
  }

  let best = null;
  let bestT = 2;

  for (const monster of monsters) {
    if (monster.hp <= 0) continue;

    const t = ((monster.x - px) * dx + (monster.y - py) * dy) / lenSq;
    if (t < 0 || t > 1) continue;

    const closestX = px + t * dx;
    const closestY = py + t * dy;
    if (distance(monster.x, monster.y, closestX, closestY) > effectiveRadius) continue;

    if (t < bestT) {
      best = monster;
      bestT = t;
    }
  }

  return { monster: best, endX, endY };
}

/**
 * Impact point for a projectile toward aim — stops on first monster or at range limit.
 * @returns {{ impactX: number, impactY: number, missed: boolean, monster: object | null }}
 */
export function resolveProjectileImpact(monsters, px, py, aimX, aimY, maxRange, hitRadius) {
  const { monster, endX, endY } = findFirstMonsterOnRay(
    monsters,
    px,
    py,
    aimX,
    aimY,
    maxRange,
    hitRadius
  );

  if (monster) {
    return {
      impactX: monster.x,
      impactY: monster.y,
      missed: false,
      monster,
    };
  }

  return {
    impactX: endX,
    impactY: endY,
    missed: true,
    monster: null,
  };
}

/**
 * Flight time for skill VFX based on distance and skill type.
 * @param {SkillDef} skill
 * @param {number} fromX
 * @param {number} fromY
 * @param {number} toX
 * @param {number} toY
 * @returns {number}
 */
export function getSkillFxDuration(skill, fromX, fromY, toX, toY) {
  const dist = distance(fromX, fromY, toX, toY);

  if (skill.type === 'projectile') {
    if (skill.id === 'icebolt') {
      return Math.min(550, Math.max(220, dist * 1.8));
    }
    if (skill.id === 'fireball') {
      return Math.min(750, Math.max(300, dist * 2.4));
    }
    return Math.min(650, Math.max(280, dist * 2));
  }

  if (skill.type === 'ground_aoe' && !skill.range) {
    return 500;
  }

  if (skill.type === 'ground_aoe' && skill.range) {
    if (skill.id === 'meteor') return 750;
    if (skill.id === 'multishot') return 480;
    if (skill.id === 'chain_spark') return Math.min(620, Math.max(280, dist * 2.4));
    return Math.min(580, Math.max(300, dist * 1.8));
  }

  if (skill.id === 'frost_nova') return 450;
  if (skill.id === 'whirlwind') return 520;
  if (skill.id === 'iron_will') return 480;
  if (skill.id === 'cleave') return 280;
  if (skill.id === 'shield_bash') return 300;
  if (skill.id === 'crimson_veil') return 480;
  if (skill.id === 'sanguine_bolt') return Math.min(650, Math.max(280, dist * 2));
  if (skill.type === 'summon' || skill.type === 'summon_heal' || skill.type === 'sacrifice') {
    return 420;
  }
  if (skill.type === 'melee_aoe') return 320;
  if (skill.type === 'dash') return 380;

  return 400;
}

/**
 * Clamp aim point to skill max range from caster.
 */
export function clampToSkillRange(px, py, aimX, aimY, maxRange) {
  const dist = distance(px, py, aimX, aimY);
  if (dist <= maxRange || dist < 1) {
    return { x: aimX, y: aimY };
  }
  const ratio = maxRange / dist;
  return {
    x: px + (aimX - px) * ratio,
    y: py + (aimY - py) * ratio,
  };
}
