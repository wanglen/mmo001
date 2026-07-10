import { isInSafeZone } from '../../../shared/zones.js';
import {
  MONSTER_ATTACK_COOLDOWN_MS,
  MONSTER_PROVOKE_CHASE_RANGE,
  resolveMonsterHitOnPlayer,
  getBossAttackCooldown,
  getBossDamageMultiplier,
  canAttackNow,
  distance,
  isInRange,
} from '../../../shared/combat.js';
import { isPlayerAlive, applyPlayerDamage } from '../../../shared/playerLife.js';
import { getEffectiveCombatStats } from '../../../shared/inventory.js';
import { applyStatusEffect, createStatusEffect } from '../../../shared/plugins/combat/statusEffects.js';
import { pushDamageFx, pushHitFlash } from './combatFx.js';
import { interruptTownRecall } from '../core/townHub.js';
import { isHostileMonster } from '../../entities/Monster.js';

/**
 * Retaliate against a player or thrall that damaged this monster.
 * @param {object} monster
 * @param {object} source player or summon
 */
export function provokeMonster(monster, source) {
  if (!source) return;

  if (source.isSummon && source.id) {
    monster.targetMonsterId = source.id;
    monster.targetPlayerId = source.ownerId ?? null;
    monster.provoked = true;
    return;
  }

  if (source.id) {
    monster.targetPlayerId = source.id;
    monster.targetMonsterId = null;
    monster.provoked = true;
  }
}

/**
 * Pick chase target: provoked thrall/player first, else nearest player or thrall in aggro.
 * @param {object} monster
 * @param {object[]} players
 * @param {object | null} map
 * @param {object[]} [summons]
 * @returns {{ kind: 'player' | 'summon', entity: object } | null}
 */
export function resolveMonsterTarget(monster, players, map = null, summons = []) {
  if (monster.isSummon) return null;

  const livingSummons = summons.filter((s) => s?.isSummon && s.hp > 0);

  if (monster.provoked && monster.targetMonsterId) {
    const summon = livingSummons.find((s) => s.id === monster.targetMonsterId);
    if (summon) {
      const d = distance(monster.x, monster.y, summon.x, summon.y);
      if (d <= MONSTER_PROVOKE_CHASE_RANGE) {
        return { kind: 'summon', entity: summon };
      }
    }
    monster.targetMonsterId = null;
  }

  if (monster.provoked && monster.targetPlayerId) {
    const target = players.find((p) => p.id === monster.targetPlayerId);
    if (
      target &&
      isPlayerAlive(target) &&
      !(map && isInSafeZone(map, target.x, target.y))
    ) {
      const d = distance(monster.x, monster.y, target.x, target.y);
      if (d <= MONSTER_PROVOKE_CHASE_RANGE) {
        return { kind: 'player', entity: target };
      }
    }
    monster.provoked = false;
    monster.targetPlayerId = null;
  }

  let best = null;
  let bestDist = monster.aggroRange;

  for (const player of players) {
    if (!isPlayerAlive(player)) continue;
    if (map && isInSafeZone(map, player.x, player.y)) continue;
    const d = distance(monster.x, monster.y, player.x, player.y);
    if (d < bestDist) {
      best = { kind: 'player', entity: player };
      bestDist = d;
    }
  }

  for (const summon of livingSummons) {
    const d = distance(monster.x, monster.y, summon.x, summon.y);
    if (d < bestDist) {
      best = { kind: 'summon', entity: summon };
      bestDist = d;
    }
  }

  return best;
}

/**
 * Thrall AI: assist owner's last combat target, else nearest hostile.
 * @param {object} summon
 * @param {object | null} owner
 * @param {object[]} hostiles
 * @returns {object | null}
 */
export function resolveSummonTarget(summon, owner, hostiles) {
  if (!summon?.isSummon || !owner) return null;

  if (owner.lastCombatTargetId) {
    const assist = hostiles.find((m) => m.id === owner.lastCombatTargetId && isHostileMonster(m));
    if (assist) {
      const d = distance(summon.x, summon.y, assist.x, assist.y);
      if (d <= summon.aggroRange * 1.5) return assist;
    }
  }

  let nearest = null;
  let nearestDist = summon.aggroRange;
  for (const monster of hostiles) {
    if (!isHostileMonster(monster)) continue;
    const d = distance(summon.x, summon.y, monster.x, monster.y);
    if (d < nearestDist) {
      nearest = monster;
      nearestDist = d;
    }
  }
  return nearest;
}

/**
 * @returns {{ ok: true, damage: number } | { ok: false, reason: string }}
 */
export function monsterAttackPlayer(monster, player, map = null, now = Date.now()) {
  if (!isPlayerAlive(player)) {
    return { ok: false, reason: 'target_dead' };
  }

  if (map && isInSafeZone(map, player.x, player.y)) {
    return { ok: false, reason: 'safe_zone' };
  }

  if (!canAttackNow(monster.lastAttackAt ?? 0, now, getBossAttackCooldown(MONSTER_ATTACK_COOLDOWN_MS, monster))) {
    return { ok: false, reason: 'cooldown' };
  }

  if (!isInRange(monster.x, monster.y, player.x, player.y, monster.attackRange)) {
    return { ok: false, reason: 'out_of_range' };
  }

  const stats = getEffectiveCombatStats(player, player.equipment);
  const scaledDamage = Math.floor(monster.damage * getBossDamageMultiplier(monster));
  const hit = resolveMonsterHitOnPlayer({
    baseDamage: scaledDamage,
    damageType: monster.damageType ?? 'physical',
    defenderDex: stats.dex,
    defenderVit: stats.vit,
    defenderResistances: player.resistances ?? {},
  });

  if (hit.dodged) {
    monster.lastAttackAt = now;
    return { ok: true, damage: 0, dodged: true, killed: false };
  }

  const result = applyPlayerDamage(player, hit.damage, now);
  if (result.damage > 0) {
    interruptTownRecall(player);
    if (monster.onHitStatus) {
      applyStatusEffect(
        player,
        createStatusEffect(monster.onHitStatus, { sourceId: monster.id, now })
      );
    }
  }
  monster.lastAttackAt = now;
  if (result.damage > 0) {
    pushDamageFx({ x: player.x, y: player.y, damage: result.damage, now });
  }

  return { ok: true, damage: result.damage, killed: result.killed, dodged: false };
}

/**
 * Hostile melee against a player thrall (no XP/loot).
 * @returns {{ ok: true, damage: number, killed: boolean } | { ok: false, reason: string }}
 */
export function monsterAttackSummon(monster, summon, monsterManager, now = Date.now()) {
  if (!monster || monster.isSummon || !summon?.isSummon || summon.hp <= 0) {
    return { ok: false, reason: 'invalid_target' };
  }

  if (!canAttackNow(monster.lastAttackAt ?? 0, now, getBossAttackCooldown(MONSTER_ATTACK_COOLDOWN_MS, monster))) {
    return { ok: false, reason: 'cooldown' };
  }

  if (!isInRange(monster.x, monster.y, summon.x, summon.y, monster.attackRange)) {
    return { ok: false, reason: 'out_of_range' };
  }

  const damage = Math.max(1, Math.floor(monster.damage * getBossDamageMultiplier(monster)));
  summon.hp = Math.max(0, summon.hp - damage);
  monster.lastAttackAt = now;
  monster.targetMonsterId = summon.id;

  if (damage > 0) {
    pushDamageFx({ x: summon.x, y: summon.y, damage, now });
    pushHitFlash({ monsterId: summon.id, now });
  }

  const killed = summon.hp <= 0;
  if (killed) {
    monsterManager.remove(summon.id);
    if (monster.targetMonsterId === summon.id) {
      monster.targetMonsterId = null;
    }
  }

  return { ok: true, damage, killed };
}

/**
 * Summon melee hit against a hostile monster.
 * @returns {{ ok: true, damage: number, killed: boolean } | { ok: false, reason: string }}
 */
export function summonAttackMonster(summon, target, now = Date.now()) {
  if (!summon?.isSummon || !isHostileMonster(target)) {
    return { ok: false, reason: 'invalid_target' };
  }

  const cooldown = summon.attackCooldownMs ?? MONSTER_ATTACK_COOLDOWN_MS;
  if (!canAttackNow(summon.lastAttackAt ?? 0, now, cooldown)) {
    return { ok: false, reason: 'cooldown' };
  }

  if (!isInRange(summon.x, summon.y, target.x, target.y, summon.attackRange)) {
    return { ok: false, reason: 'out_of_range' };
  }

  const damage = Math.max(1, Math.floor(summon.damage));
  target.hp = Math.max(0, target.hp - damage);
  summon.lastAttackAt = now;
  summon.targetMonsterId = target.id;
  pushDamageFx({ x: target.x, y: target.y, damage, now });

  return { ok: true, damage, killed: target.hp <= 0 };
}
