import { canMoveTo } from '../../map/collision.js';
import { facingFromTarget } from '../../../shared/aim.js';
import { distance, isInRange, SKILL_AIM_RADIUS } from '../../../shared/combat.js';
import { getEffectiveCombatStats } from '../../../shared/inventory.js';
import {
  canUseSkill,
  calculateSkillDamage,
  clampToSkillRange,
  findMonstersInArc,
  findMonstersInRadius,
  findMonsterAtGroundPoint,
  resolveProjectileImpact,
  getSkill,
  getSkillFxDuration,
  spendSkillMp,
} from '../../../shared/skills.js';
import { applyMonsterDamage } from './combat.js';
import { isInSafeZone } from '../../../shared/zones.js';

export const SKILL_FX_MS = 400;

/**
 * Dash toward aim, stopping on collision.
 * @returns {{ moved: number, endX: number, endY: number }}
 */
export function dashToward(map, player, targetX, targetY, maxDist) {
  const dx = targetX - player.x;
  const dy = targetY - player.y;
  const dist = Math.hypot(dx, dy);

  if (dist < 1) {
    return { moved: 0, endX: player.x, endY: player.y };
  }

  const step = Math.min(dist, maxDist);
  const nx = player.x + (dx / dist) * step;
  const ny = player.y + (dy / dist) * step;

  if (canMoveTo(map, nx, ny)) {
    player.x = nx;
    player.y = ny;
    return { moved: step, endX: nx, endY: ny };
  }

  for (let t = step - 8; t > 0; t -= 8) {
    const tx = player.x + (dx / dist) * t;
    const ty = player.y + (dy / dist) * t;
    if (canMoveTo(map, tx, ty)) {
      player.x = tx;
      player.y = ty;
      return { moved: t, endX: tx, endY: ty };
    }
  }

  return { moved: 0, endX: player.x, endY: player.y };
}

function ensureSkillState(player) {
  if (!player.skillCooldowns) player.skillCooldowns = {};
}

function resolveSkillImpact(skill, player, aimX, aimY, hits) {
  if (hits.length > 0) {
    const primary = hits[0];
    return {
      impactX: primary.x,
      impactY: primary.y,
      targetX: primary.x,
      targetY: primary.y,
      missed: false,
    };
  }

  const maxR = skill.range ?? 200;
  const clamped = clampToSkillRange(player.x, player.y, aimX, aimY, maxR);

  return {
    impactX: clamped.x,
    impactY: clamped.y,
    targetX: clamped.x,
    targetY: clamped.y,
    missed: skill.type === 'projectile' || skill.type === 'single_target',
  };
}

function recordSkillCast(player, skill, impact, now) {
  ensureSkillState(player);
  spendSkillMp(player, skill.mpCost);
  player.skillCooldowns[skill.id] = now;
  player.attacking = true;
  player.moving = false;
  player.lastSkillFx = {
    skillId: skill.id,
    x: player.x,
    y: player.y,
    targetX: impact.targetX,
    targetY: impact.targetY,
    impactX: impact.impactX,
    impactY: impact.impactY,
    missed: impact.missed,
    durationMs: getSkillFxDuration(
      skill,
      player.x,
      player.y,
      impact.impactX,
      impact.impactY
    ),
    at: now,
  };
  player.lastSkillAt = now;

  const facing = facingFromTarget(player.x, player.y, impact.targetX, impact.targetY);
  if (facing) player.facing = facing;
}

function damageMonsters({
  monsters,
  player,
  skill,
  combatStats,
  monsterManager,
  lootManager,
  partyManager,
  playerManager,
  eventBus = null,
  now,
}) {
  const results = [];
  const seen = new Set();

  for (const monster of monsters) {
    if (seen.has(monster.id)) continue;
    seen.add(monster.id);

    const live = monsterManager.get(monster.id);
    if (!live || live.hp <= 0) continue;

    const damage = calculateSkillDamage(skill, combatStats);
    const result = applyMonsterDamage({
      monster: live,
      damage,
      player,
      monsterManager,
      lootManager,
      partyManager,
      playerManager,
      eventBus,
      now,
    });
    results.push({ monsterId: monster.id, ...result });
  }

  return results;
}

export function processSkill({
  player,
  skillId,
  targetX,
  targetY,
  targetId,
  monsterManager,
  lootManager,
  map,
  partyManager = null,
  playerManager = null,
  eventBus = null,
  now = Date.now(),
}) {
  const check = canUseSkill(player, skillId, now);
  if (!check.ok) return { ok: false, reason: check.reason };

  if (isInSafeZone(map, player.x, player.y)) {
    return { ok: false, reason: 'safe_zone' };
  }

  const skill = getSkill(skillId);
  if (!skill) return { ok: false, reason: 'invalid_skill' };

  const aimX = typeof targetX === 'number' ? targetX : player.aimX;
  const aimY = typeof targetY === 'number' ? targetY : player.aimY;
  const combatStats = getEffectiveCombatStats(player, player.equipment);
  const monsters = monsterManager.getAllEntities();
  let hits = [];
  let projectileImpact = null;

  switch (skill.type) {
    case 'melee_aoe': {
      hits = findMonstersInArc(
        monsters,
        player.x,
        player.y,
        aimX,
        aimY,
        skill.range ?? 52
      );
      break;
    }
    case 'dash': {
      const startX = player.x;
      const startY = player.y;
      dashToward(map, player, aimX, aimY, skill.dashDistance ?? 96);
      const radius = skill.radius ?? 32;
      hits = findMonstersInRadius(monsters, player.x, player.y, radius);
      if (hits.length === 0) {
        const alongPath = findMonstersInRadius(
          monsters,
          (startX + player.x) / 2,
          (startY + player.y) / 2,
          radius + (skill.dashDistance ?? 96) / 2
        );
        hits = alongPath.slice(0, 1);
      }
      break;
    }
    case 'projectile': {
      const maxR = skill.range ?? 200;
      const hitR = skill.radius ?? 24;
      projectileImpact = resolveProjectileImpact(
        monsters,
        player.x,
        player.y,
        aimX,
        aimY,
        maxR,
        hitR
      );
      if (projectileImpact.monster) hits = [projectileImpact.monster];
      break;
    }
    case 'ground_aoe': {
      if (skill.range && distance(player.x, player.y, aimX, aimY) > skill.range) {
        return { ok: false, reason: 'out_of_range' };
      }
      const cx = skill.range ? aimX : player.x;
      const cy = skill.range ? aimY : player.y;
      hits = findMonstersInRadius(monsters, cx, cy, skill.radius ?? 40);
      break;
    }
    case 'single_target': {
      let monster = null;
      if (typeof targetId === 'string') {
        monster = monsterManager.get(targetId);
      }
      if (!monster) {
        monster = findMonsterAtGroundPoint(
          monsters,
          player.x,
          player.y,
          aimX,
          aimY,
          skill.range ?? 160,
          SKILL_AIM_RADIUS
        );
      }
      if (!monster || monster.hp <= 0) {
        return { ok: false, reason: 'no_target' };
      }
      if (!isInRange(player.x, player.y, monster.x, monster.y, skill.range ?? 160)) {
        return { ok: false, reason: 'out_of_range' };
      }
      hits = [monster];
      break;
    }
    default:
      return { ok: false, reason: 'invalid_skill' };
  }

  const impact = projectileImpact
    ? {
        impactX: projectileImpact.impactX,
        impactY: projectileImpact.impactY,
        targetX: projectileImpact.impactX,
        targetY: projectileImpact.impactY,
        missed: projectileImpact.missed,
      }
    : resolveSkillImpact(skill, player, aimX, aimY, hits);
  recordSkillCast(player, skill, impact, now);

  const damageResults = damageMonsters({
    monsters: hits,
    player,
    skill,
    combatStats,
    monsterManager,
    lootManager,
    partyManager,
    playerManager,
    eventBus,
    now,
  });

  return {
    ok: true,
    skillId: skill.id,
    hits: damageResults,
    mpSpent: skill.mpCost,
    missed: impact.missed,
  };
}

export function clearSkillAnim(player, now = Date.now()) {
  if (!player.lastSkillAt) return;
  const fxMs = player.lastSkillFx?.durationMs ?? SKILL_FX_MS;
  if (now - player.lastSkillAt < fxMs) return;
  if (player.lastAttackAt && now - player.lastAttackAt < 250) return;
  player.attacking = false;
}

export function collectActiveSkillFx(playerManager, now = Date.now()) {
  const fx = [];
  for (const player of playerManager.getAllEntities()) {
    if (!player.lastSkillFx) continue;
    const duration = player.lastSkillFx.durationMs ?? SKILL_FX_MS;
    if (now - player.lastSkillFx.at < duration) {
      fx.push({
        playerId: player.id,
        ...player.lastSkillFx,
      });
    }
  }
  return fx;
}
