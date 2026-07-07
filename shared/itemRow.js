import { getRarityColor } from './items.js';
import { capitalizeWord, formatSlotType } from './itemDisplay.js';
import { isConsumable } from './consumables.js';

export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function escapeAttr(text) {
  return String(text).replace(/"/g, '&quot;');
}

export function getItemTypeLabel(item) {
  if (isConsumable(item) || item.type === 'consumable' || item.kind === 'potion') {
    return 'Consumable';
  }
  return formatSlotType(item.slot ?? item.type ?? 'item');
}

/**
 * @param {string} name
 * @param {string} rarity
 * @param {string} typeLabel
 */
export function buildItemInfoHtml(name, rarity, typeLabel) {
  const color = getRarityColor(rarity);
  const meta = `${typeLabel} · ${capitalizeWord(rarity)}`;
  return `<div class="vendor-item-info">
    <span class="vendor-item-name" style="color: ${color}">${escapeHtml(name)}</span>
    <span class="vendor-item-meta">${escapeHtml(meta)}</span>
  </div>`;
}

/**
 * @param {object} options
 * @param {string} options.name
 * @param {string} [options.rarity]
 * @param {string} options.typeLabel
 * @param {number | string} [options.price]
 * @param {{ attr: string, value: string | number, label: string }} [options.action]
 */
export function buildItemRowHtml({ name, rarity = 'common', typeLabel, price, action }) {
  const priceHtml =
    price != null ? `<span class="vendor-item-price">${escapeHtml(String(price))}g</span>` : '';
  const actionHtml = action
    ? `<button type="button" class="btn-inline" data-${escapeAttr(action.attr)}="${escapeAttr(String(action.value))}">${escapeHtml(action.label)}</button>`
    : '';

  return `<li class="vendor-row">
    ${buildItemInfoHtml(name, rarity, typeLabel)}
    ${priceHtml}
    ${actionHtml}
  </li>`;
}
