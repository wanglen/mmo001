import { resolveItemIconKey } from '/shared/itemIcons.js';
import { buildItemIconSvg } from './itemIconSvg.js';

/**
 * HTML for a slot cell: type icon tinted by rarity (or muted when empty).
 * @param {object|null} item
 * @param {string} [slotType] - equipment slot name when cell is empty
 */
export function buildSlotIconHtml(item, slotType = '') {
  const type = resolveItemIconKey(item, slotType);
  const icon = buildItemIconSvg(type);
  const empty = !item;

  return `<span class="slot-visual${empty ? ' slot-visual--empty' : ''}">${icon}</span>`;
}

export { buildItemIconSvg } from './itemIconSvg.js';

/** @deprecated Use resolveItemIconKey from shared/itemIcons.js */
export function resolveIconType(item, fallbackSlot = '') {
  return resolveItemIconKey(item, fallbackSlot);
}
