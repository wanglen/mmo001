import { isInSafeZone } from '../../../shared/zones.js';
import {
  ATTACK_ANIM_MS,
  ATTACK_RANGE_LEEWAY,
  calculateDamage,
  canAttackNow,
  isInAttackRange,
} from '../../../shared/combat.js';
import { facingFromTarget } from '../../../shared/aim.js';
import { grantXp } from '../../../shared/stats.js';
import { getPartyXpRecipients } from '../../../shared/social.js';
import { getEffectiveCombatStats } from '../../../shared/inventory.js';
import { pushDamageFx, pushHitFlash } from './combatFx.js';
import { provokeMonster } from './monsterCombat.js';
import { DOMAIN_EVENTS } from '../../../shared/plugins/domainEvents.js';

export function applyMonsterDamage({
  monster,
  damage,
  player,
  monsterManager,
  lootManager,
  partyManager = null,
  playerManager = null,
  eventBus = null,
  now = Date.now(),
}) {
  monster.hp = Math.max(0, monster.hp - damage);
  const killed = monster.hp <= 0;
  let xpResult = null;
  let lootDrop = null;
  let xpRecipientIds = [];

  provokeMonster(monster, player);

  pushDamageFx({ x: monster.x, y: monster.y, damage, now });
  pushHitFlash({ monsterId: monster.id, now });

  if (killed) {
    const allPlayers = playerManager?.getAllEntities?.() ?? [player];
    const partyMemberIds = partyManager?.getMemberIds(player.id) ?? [player.id];
    const recipients = getPartyXpRecipients(player, partyMemberIds, allPlayers);

    for (const recipient of recipients) {
      const result = grantXp(recipient, monster.xpReward, recipient.characterClass);
      if (recipient.id === player.id) xpResult = result;
      xpRecipientIds.push(recipient.id);
    }

    monsterManager.remove(monster.id);

    eventBus?.emit(DOMAIN_EVENTS.MONSTER_KILLED, {
      killer: player,
      monster,
      recipients,
      partyMemberIds,
      allPlayers,
      lootManager,
      now,
    });
  }

  return { damage, killed, xp: xpResult, xpRecipientIds, lootDrop };
}

export function processAttack({
  player,
  targetId,
  monsterManager,
  lootManager,
  map,
  partyManager = null,
  playerManager = null,
  eventBus = null,
  now = Date.now(),
}) {
  if (!canAttackNow(player.lastAttackAt ?? 0, now)) {
    return { ok: false, reason: 'cooldown' };
  }

  if (map && isInSafeZone(map, player.x, player.y)) {
    return { ok: false, reason: 'safe_zone' };
  }

  const monster = monsterManager.get(targetId);
  if (!monster || monster.hp <= 0) {
    return { ok: false, reason: 'invalid_target' };
  }

  if (!isInAttackRange(player.x, player.y, monster.x, monster.y, ATTACK_RANGE_LEEWAY)) {
    return { ok: false, reason: 'out_of_range' };
  }

  const damage = calculateDamage(getEffectiveCombatStats(player, player.equipment).str);
  player.lastAttackAt = now;
  player.attacking = true;
  player.moving = false;

  const facing = facingFromTarget(player.x, player.y, monster.x, monster.y);
  if (facing) player.facing = facing;

  const result = applyMonsterDamage({
    monster,
    damage,
    player,
    monsterManager,
    lootManager,
    partyManager,
    playerManager,
    eventBus,
    now,
  });

  return { ok: true, ...result };
}

export function clearAttackAnim(player, now = Date.now()) {
  if (player.attacking && now - (player.lastAttackAt ?? 0) >= ATTACK_ANIM_MS) {
    player.attacking = false;
  }
}
