import { createEmptyResistances, DAMAGE_TYPE } from '../../../shared/plugins/combat/damageTypes.js';
import {
  getMaxSummonSlots,
  getSummonDef,
  getSummonCastRange,
  pickSummonsToReplace,
  scaleSummonStats,
} from '../../../shared/summons.js';
import { getEffectiveCombatStats } from '../../../shared/inventory.js';
import { canMoveTo } from '../../map/collision.js';
import { clampToSkillRange } from '../../../shared/skills.js';

let nextSummonId = 1;

/**
 * @param {import('../../entities/MonsterManager.js').MonsterManager} monsterManager
 * @param {string} ownerId
 */
export function getOwnedSummons(monsterManager, ownerId) {
  if (!monsterManager?.getAllEntities) return [];
  return monsterManager
    .getAllEntities()
    .filter((m) => m.isSummon && m.ownerId === ownerId && m.hp > 0);
}

/**
 * Remove all thralls owned by a player on one map.
 * @param {import('../../entities/MonsterManager.js').MonsterManager} monsterManager
 * @param {string} ownerId
 */
export function removeOwnedSummons(monsterManager, ownerId) {
  if (!monsterManager) return;
  for (const summon of getOwnedSummons(monsterManager, ownerId)) {
    monsterManager.remove(summon.id);
  }
}

/**
 * Remove thralls for a player across every map instance.
 * @param {{ monsterManagers?: Map<string, object> }} world
 * @param {string} ownerId
 */
export function removeOwnedSummonsAcrossWorld(world, ownerId) {
  if (!world || !ownerId) return;
  if (world.monsterManagers instanceof Map) {
    for (const manager of world.monsterManagers.values()) {
      removeOwnedSummons(manager, ownerId);
    }
  }
}

/**
 * @param {object} player
 * @param {object} skill
 * @param {import('../../entities/MonsterManager.js').MonsterManager} monsterManager
 * @param {object} map
 * @param {number} [aimX]
 * @param {number} [aimY]
 * @param {number} [now]
 * @returns {{ ok: true, summons: object[], castX: number, castY: number } | { ok: false, reason: string }}
 */
export function spawnSummonsFromSkill({
  player,
  skill,
  monsterManager,
  map,
  aimX = player.x,
  aimY = player.y,
  now = Date.now(),
}) {
  const summonType = skill.summonType;
  const def = getSummonDef(summonType);
  if (!def) return { ok: false, reason: 'invalid_summon' };

  const castRange = getSummonCastRange(player.level ?? 1);
  const cast = clampToSkillRange(player.x, player.y, aimX, aimY, castRange);

  const count = Math.max(1, Math.floor(Number(skill.summonCount) || 1));
  const neededSlots = count * (def.slotCost ?? 1);
  const maxSlots = getMaxSummonSlots(player.level ?? 1);
  const owned = getOwnedSummons(monsterManager, player.id);
  const replaceIds = pickSummonsToReplace(owned, neededSlots, maxSlots);
  for (const id of replaceIds) {
    monsterManager.remove(id);
  }

  const combat = getEffectiveCombatStats(player, player.equipment);
  const ownerStats = {
    vit: combat.vit ?? player.vit ?? 1,
    level: player.level ?? 1,
  };

  const summons = [];
  for (let i = 0; i < count; i++) {
    const offsetAngle = (Math.PI * 2 * i) / count - Math.PI / 2;
    const offset = count === 1 ? 0 : 18 + i * 4;
    let x = cast.x + Math.cos(offsetAngle) * offset;
    let y = cast.y + Math.sin(offsetAngle) * offset;
    if (map && !canMoveTo(map, x, y)) {
      if (canMoveTo(map, cast.x, cast.y)) {
        x = cast.x;
        y = cast.y;
      } else {
        x = player.x;
        y = player.y;
      }
    }

    const scaled = scaleSummonStats(def, ownerStats);
    const summon = {
      id: `s${nextSummonId++}`,
      type: summonType,
      label: def.label,
      level: ownerStats.level,
      x,
      y,
      maxHp: scaled.hp,
      hp: scaled.hp,
      speed: def.speed,
      baseSpeed: def.speed,
      damage: scaled.damage,
      aggroRange: def.aggroRange,
      attackRange: def.attackRange,
      attackCooldownMs: def.attackCooldownMs,
      color: def.color,
      xpReward: 0,
      isBoss: false,
      isElite: false,
      eliteModifier: null,
      damageType: DAMAGE_TYPE.PHYSICAL,
      resistances: createEmptyResistances(),
      onHitStatus: null,
      statusEffects: [],
      moving: false,
      targetPlayerId: null,
      targetMonsterId: null,
      provoked: false,
      lastAttackAt: 0,
      isSummon: true,
      ownerId: player.id,
      slotCost: def.slotCost ?? 1,
      spawnedAt: now + i,
      expiresAt: now + def.durationMs,
      toJSON() {
        return {
          id: this.id,
          type: this.type,
          label: this.label,
          x: this.x,
          y: this.y,
          hp: this.hp,
          maxHp: this.maxHp,
          color: this.color,
          moving: this.moving,
          isBoss: false,
          isElite: false,
          level: this.level,
          isSummon: true,
          ownerId: this.ownerId,
          expiresAt: this.expiresAt,
        };
      },
    };

    monsterManager.monsters.set(summon.id, summon);
    summons.push(summon);
  }

  return { ok: true, summons, castX: cast.x, castY: cast.y };
}

/**
 * Heal owned thralls near the caster.
 * @returns {number} total HP restored
 */
export function healOwnedSummons({ player, skill, monsterManager, combatStats }) {
  const radius = skill.radius ?? 160;
  const heal = Math.max(
    1,
    Math.floor((combatStats.vit ?? 1) * (skill.healMult ?? 2) * 0.72)
  );
  let total = 0;
  for (const summon of getOwnedSummons(monsterManager, player.id)) {
    const dist = Math.hypot(summon.x - player.x, summon.y - player.y);
    if (dist > radius) continue;
    const before = summon.hp;
    summon.hp = Math.min(summon.maxHp, summon.hp + heal);
    total += summon.hp - before;
  }
  return total;
}

/**
 * Sacrifice thralls in radius; returns bonus damage pool from remaining HP.
 */
export function sacrificeOwnedSummons({ player, skill, monsterManager }) {
  const radius = skill.radius ?? 96;
  const owned = getOwnedSummons(monsterManager, player.id).filter(
    (s) => Math.hypot(s.x - player.x, s.y - player.y) <= radius
  );
  if (owned.length === 0) return { sacrificed: [], bonusDamage: 0 };

  let bonusDamage = 0;
  const mult = skill.sacrificeDamageMult ?? 1;
  for (const summon of owned) {
    bonusDamage += Math.max(1, Math.floor(summon.hp * mult));
    monsterManager.remove(summon.id);
  }
  return { sacrificed: owned, bonusDamage };
}
