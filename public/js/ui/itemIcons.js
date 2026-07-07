import { resolveItemIconKey } from '/shared/itemIcons.js';
import { getRarityColor } from '/shared/items.js';
import { CONSUMABLE_KIND, getStackCount } from '/shared/consumables.js';
import { buildItemIconSvg } from './itemIconSvg.js';

/** Inventory tint for consumable potions (overrides rarity color). */
export const POTION_ICON_COLORS = {
  [CONSUMABLE_KIND.HEALTH]: '#e74c3c',
  [CONSUMABLE_KIND.MANA]: '#87ceeb',
};

/**
 * Icon color for inventory slots — potions use fixed HP/MP colors.
 * @param {object | null} item
 * @param {string} [emptyColor]
 */
export function getInventoryIconColor(item, emptyColor = '#4a5a6a') {
  if (!item) return emptyColor;
  if (item.consumableKind === CONSUMABLE_KIND.HEALTH) {
    return POTION_ICON_COLORS[CONSUMABLE_KIND.HEALTH];
  }
  if (item.consumableKind === CONSUMABLE_KIND.MANA) {
    return POTION_ICON_COLORS[CONSUMABLE_KIND.MANA];
  }
  return getRarityColor(item.rarity);
}

/**
 * HTML for a slot cell: type icon tinted by rarity (or muted when empty).
 * @param {object|null} item
 * @param {string} [slotType] - equipment slot name when cell is empty
 */
export function buildSlotIconHtml(item, slotType = '') {
  const type = resolveItemIconKey(item, slotType);
  const icon = buildItemIconSvg(type);
  const empty = !item;
  const stack = item ? getStackCount(item) : 0;
  const stackBadge = stack > 1 ? `<span class="slot-stack-badge">${stack}</span>` : '';

  return `<span class="slot-visual${empty ? ' slot-visual--empty' : ''}">${icon}${stackBadge}</span>`;
}

export { buildItemIconSvg } from './itemIconSvg.js';

/** @deprecated Use resolveItemIconKey from shared/itemIcons.js */
export function resolveIconType(item, fallbackSlot = '') {
  return resolveItemIconKey(item, fallbackSlot);
}
