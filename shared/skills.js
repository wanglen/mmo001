import { distance } from './combat.js';

export const SKILL_SLOT_COUNT = 8;

/** @typedef {'melee_aoe' | 'dash' | 'projectile' | 'ground_aoe' | 'single_target'} SkillType */

/**
 * @typedef {object} SkillDef
 * @property {string} id
 * @property {string} name
 * @property {string} icon
 * @property {string[]} classes
 * @property {number} mpCost
 * @property {number} cooldownMs
 * @property {SkillType} type
 * @property {number} [range]
 * @property {number} [radius]
 * @property {number} [dashDistance]
 * @property {'str' | 'dex' | 'int'} damageStat
 * @property {number} damageMult
 */

/** @type {Record<string, SkillDef>} */
export const SKILLS = {
  cleave: {
    id: 'cleave',
    name: 'Cleave',
    icon: '⚔',
    classes: ['warrior'],
    mpCost: 8,
    cooldownMs: 2000,
    type: 'melee_aoe',
    range: 52,
    radius: 40,
    damageStat: 'str',
    damageMult: 1.5,
  },
  charge: {
    id: 'charge',
    name: 'Charge',
    icon: '💨',
    classes: ['warrior'],
    mpCost: 12,
    cooldownMs: 4000,
    type: 'dash',
    dashDistance: 96,
    radius: 32,
    damageStat: 'str',
    damageMult: 2,
  },
  fireball: {
    id: 'fireball',
    name: 'Fireball',
    icon: '🔥',
    classes: ['mage'],
    mpCost: 10,
    cooldownMs: 1500,
    type: 'projectile',
    range: 200,
    radius: 24,
    damageStat: 'int',
    damageMult: 2,
  },
  icebolt: {
    id: 'icebolt',
    name: 'Icebolt',
    icon: '❄',
    classes: ['mage'],
    mpCost: 8,
    cooldownMs: 1200,
    type: 'projectile',
    range: 200,
    radius: 20,
    damageStat: 'int',
    damageMult: 1.8,
  },
  arrow_shot: {
    id: 'arrow_shot',
    name: 'Arrow Shot',
    icon: '🏹',
    classes: ['ranger'],
    mpCost: 6,
    cooldownMs: 1000,
    type: 'single_target',
    range: 160,
    damageStat: 'dex',
    damageMult: 2,
  },
  multishot: {
    id: 'multishot',
    name: 'Multishot',
    icon: '✦',
    classes: ['ranger'],
    mpCost: 14,
    cooldownMs: 3000,
    type: 'ground_aoe',
    range: 160,
    radius: 40,
    damageStat: 'dex',
    damageMult: 1.3,
  },
};

/** @type {Record<string, (string | null)[]>} */
export const CLASS_SKILL_BARS = {
  warrior: ['cleave', 'charge', null, null, null, null, null, null],
  mage: ['fireball', 'icebolt', null, null, null, null, null, null],
  ranger: ['arrow_shot', 'multishot', null, null, null, null, null, null],
};

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

  const mp = player.mp ?? 0;
  if (mp < skill.mpCost) return { ok: false, reason: 'no_mp' };

  const lastCast = player.skillCooldowns?.[skillId] ?? 0;
  if (now - lastCast < skill.cooldownMs) {
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
  const bar = CLASS_SKILL_BARS[player.characterClass] ?? [];
  const remaining = {};

  for (const skillId of bar) {
    if (!skillId) continue;
    const skill = SKILLS[skillId];
    const lastCast = player.skillCooldowns?.[skillId] ?? 0;
    remaining[skillId] = Math.max(0, skill.cooldownMs - (now - lastCast));
  }

  return remaining;
}

/**
 * @param {SkillDef} skill
 * @param {object} combatStats
 * @returns {number}
 */
export function calculateSkillDamage(skill, combatStats) {
  const stat = combatStats[skill.damageStat] ?? 5;
  const base = Math.max(1, Math.floor(stat * skill.damageMult));
  const variance = Math.floor(Math.random() * 3);
  return base + variance;
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
    if (distance(monster.x, monster.y, closestX, closestY) > hitRadius) continue;

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
