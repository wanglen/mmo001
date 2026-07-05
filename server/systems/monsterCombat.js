import { isInSafeZone } from '../../shared/zones.js';
import {
  MONSTER_ATTACK_COOLDOWN_MS,
  MONSTER_PROVOKE_CHASE_RANGE,
  calculateMonsterDamage,
  canAttackNow,
  distance,
  isInRange,
} from '../../shared/combat.js';
import { isPlayerAlive, applyPlayerDamage } from '../../shared/playerLife.js';
import { getEffectiveCombatStats } from '../../shared/inventory.js';
import { pushDamageFx } from './combatFx.js';
import { interruptTownRecall } from './townHub.js';

/** Monster retaliates against the player who damaged it. */
export function provokeMonster(monster, player) {
  monster.targetPlayerId = player.id;
  monster.provoked = true;
}

/**
 * Pick chase target: provoked attacker first, else nearest in aggro range.
 * @param {object} monster
 * @param {object[]} players
 * @returns {object | null}
 */
export function resolveMonsterTarget(monster, players, map = null) {
  if (monster.provoked && monster.targetPlayerId) {
    const target = players.find((p) => p.id === monster.targetPlayerId);
    if (
      target &&
      isPlayerAlive(target) &&
      !(map && isInSafeZone(map, target.x, target.y))
    ) {
      const d = distance(monster.x, monster.y, target.x, target.y);
      if (d <= MONSTER_PROVOKE_CHASE_RANGE) return target;
    }
    monster.provoked = false;
    monster.targetPlayerId = null;
  }

  let nearest = null;
  let nearestDist = monster.aggroRange;

  for (const player of players) {
    if (!isPlayerAlive(player)) continue;
    if (map && isInSafeZone(map, player.x, player.y)) continue;
    const d = distance(monster.x, monster.y, player.x, player.y);
    if (d < nearestDist) {
      nearest = player;
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

  if (!canAttackNow(monster.lastAttackAt ?? 0, now, MONSTER_ATTACK_COOLDOWN_MS)) {
    return { ok: false, reason: 'cooldown' };
  }

  if (!isInRange(monster.x, monster.y, player.x, player.y, monster.attackRange)) {
    return { ok: false, reason: 'out_of_range' };
  }

  const vit = getEffectiveCombatStats(player, player.equipment).vit;
  const damage = calculateMonsterDamage(monster.damage, vit);
  const result = applyPlayerDamage(player, damage, now);
  if (result.damage > 0) interruptTownRecall(player);
  monster.lastAttackAt = now;
  pushDamageFx({ x: player.x, y: player.y, damage: result.damage, now });

  return { ok: true, damage: result.damage, killed: result.killed };
}
