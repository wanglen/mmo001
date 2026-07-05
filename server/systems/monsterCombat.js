import {
  MONSTER_ATTACK_COOLDOWN_MS,
  MONSTER_PROVOKE_CHASE_RANGE,
  calculateMonsterDamage,
  canAttackNow,
  distance,
  isInRange,
} from '../../shared/combat.js';
import { getEffectiveCombatStats } from '../../shared/inventory.js';
import { pushDamageFx } from './combatFx.js';

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
export function resolveMonsterTarget(monster, players) {
  if (monster.provoked && monster.targetPlayerId) {
    const target = players.find((p) => p.id === monster.targetPlayerId);
    if (target) {
      const d = distance(monster.x, monster.y, target.x, target.y);
      if (d <= MONSTER_PROVOKE_CHASE_RANGE) return target;
    }
    monster.provoked = false;
    monster.targetPlayerId = null;
  }

  let nearest = null;
  let nearestDist = monster.aggroRange;

  for (const player of players) {
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
export function monsterAttackPlayer(monster, player, now = Date.now()) {
  if (!canAttackNow(monster.lastAttackAt ?? 0, now, MONSTER_ATTACK_COOLDOWN_MS)) {
    return { ok: false, reason: 'cooldown' };
  }

  if (!isInRange(monster.x, monster.y, player.x, player.y, monster.attackRange)) {
    return { ok: false, reason: 'out_of_range' };
  }

  const vit = getEffectiveCombatStats(player, player.equipment).vit;
  const damage = calculateMonsterDamage(monster.damage, vit);
  player.hp = Math.max(0, (player.hp ?? 0) - damage);
  monster.lastAttackAt = now;
  pushDamageFx({ x: player.x, y: player.y, damage, now });

  return { ok: true, damage };
}
