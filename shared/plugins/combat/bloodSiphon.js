import { distance } from './combat.js';
import { getEffectiveCombatStats } from '../../inventory.js';
import { isPlayerAlive } from '../../playerLife.js';

/** Max distance (px) from corpse for Blood Siphon to heal. */
export const BLOOD_SIPHON_RANGE = 160;

/**
 * Life restored on a nearby kill for Blood Necromancer.
 * @param {object} player
 * @returns {number}
 */
export function getBloodSiphonHealAmount(player) {
  if (player?.characterClass !== 'necromancer') return 0;
  const combat = getEffectiveCombatStats(player, player.equipment);
  const vit = Math.max(1, Number(combat.vit) || 1);
  const level = Math.max(1, Math.floor(Number(player.level) || 1));
  return Math.max(3, Math.floor(vit * 0.4 + level * 0.5));
}

/**
 * @param {object} player
 * @param {{ x: number, y: number }} monster
 * @param {number} [range]
 */
export function isInBloodSiphonRange(player, monster, range = BLOOD_SIPHON_RANGE) {
  if (!player || !monster) return false;
  return distance(player.x, player.y, monster.x, monster.y) <= range;
}

/**
 * Heal the necromancer if they are close enough to the slain monster.
 * @returns {number} HP actually restored
 */
export function tryBloodSiphon(player, monster) {
  if (!player || player.characterClass !== 'necromancer') return 0;
  if (!isPlayerAlive(player)) return 0;
  if (!isInBloodSiphonRange(player, monster)) return 0;

  const amount = getBloodSiphonHealAmount(player);
  if (amount <= 0) return 0;

  const maxHp = player.maxHp ?? player.hp;
  const before = player.hp ?? 0;
  player.hp = Math.min(maxHp, before + amount);
  return player.hp - before;
}
