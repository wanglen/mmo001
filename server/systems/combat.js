import {
  ATTACK_ANIM_MS,
  calculateDamage,
  canAttackNow,
  isInRange,
} from '../../shared/combat.js';
import { facingFromTarget } from '../../shared/aim.js';
import { grantXp } from '../../shared/stats.js';
import { getEffectiveCombatStats } from '../../shared/inventory.js';
import { rollLoot } from '../../shared/items.js';

export function processAttack({ player, targetId, monsterManager, lootManager, now = Date.now() }) {
  if (!canAttackNow(player.lastAttackAt ?? 0, now)) {
    return { ok: false, reason: 'cooldown' };
  }

  const monster = monsterManager.get(targetId);
  if (!monster || monster.hp <= 0) {
    return { ok: false, reason: 'invalid_target' };
  }

  if (!isInRange(player.x, player.y, monster.x, monster.y)) {
    return { ok: false, reason: 'out_of_range' };
  }

  const damage = calculateDamage(getEffectiveCombatStats(player, player.equipment).str);
  monster.hp = Math.max(0, monster.hp - damage);
  const killed = monster.hp <= 0;
  const monsterType = monster.type;
  player.lastAttackAt = now;
  player.attacking = true;
  player.moving = false;

  const facing = facingFromTarget(player.x, player.y, monster.x, monster.y);
  if (facing) player.facing = facing;

  let xpResult = null;
  let lootDrop = null;
  if (killed) {
    xpResult = grantXp(player, monster.xpReward, player.characterClass);
    if (lootManager) {
      const item = rollLoot(monsterType);
      if (item) lootDrop = lootManager.spawn(monster.x, monster.y, item);
    }
    monsterManager.remove(monster.id);
  }

  return { ok: true, damage, killed, xp: xpResult, lootDrop };
}

export function clearAttackAnim(player, now = Date.now()) {
  if (player.attacking && now - (player.lastAttackAt ?? 0) >= ATTACK_ANIM_MS) {
    player.attacking = false;
  }
}
