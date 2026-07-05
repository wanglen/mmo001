import { ITEM_TYPES } from './items.js';

export const CONSUMABLE_KIND = {
  HEALTH: 'health',
  MANA: 'mana',
};

/**
 * @param {object | null | undefined} item
 */
export function isConsumable(item) {
  return item?.type === ITEM_TYPES.CONSUMABLE && !!item.consumableKind;
}

/**
 * Use a consumable on a living player (does not remove from inventory).
 * @param {object} player
 * @param {object} item
 * @returns {{ ok: true, kind: string, restored: number } | { ok: false, reason: string }}
 */
export function applyConsumable(player, item) {
  if (!isConsumable(item)) return { ok: false, reason: 'not_consumable' };
  if (player.dead || (player.hp ?? 0) <= 0) return { ok: false, reason: 'dead' };

  const amount = Math.max(1, item.restoreAmount ?? 0);

  if (item.consumableKind === CONSUMABLE_KIND.HEALTH) {
    const maxHp = player.maxHp ?? 0;
    const before = player.hp ?? 0;
    if (before >= maxHp) return { ok: false, reason: 'full_hp' };
    player.hp = Math.min(maxHp, before + amount);
    return { ok: true, kind: CONSUMABLE_KIND.HEALTH, restored: player.hp - before };
  }

  if (item.consumableKind === CONSUMABLE_KIND.MANA) {
    const maxMp = player.maxMp ?? 0;
    const before = player.mp ?? 0;
    if (before >= maxMp) return { ok: false, reason: 'full_mp' };
    player.mp = Math.min(maxMp, before + amount);
    return { ok: true, kind: CONSUMABLE_KIND.MANA, restored: player.mp - before };
  }

  return { ok: false, reason: 'unknown_kind' };
}
