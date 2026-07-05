import { getRarityColor } from './items.js';

const STAT_LABELS = {
  str: 'Strength',
  dex: 'Dexterity',
  int: 'Intelligence',
  vit: 'Vitality',
  hp: 'Life',
  mp: 'Mana',
};

const STAT_ORDER = ['str', 'dex', 'int', 'vit', 'hp', 'mp'];

const SLOT_LABELS = {
  weapon: 'Weapon',
  helm: 'Helm',
  chest: 'Chest',
  gloves: 'Gloves',
  boots: 'Boots',
  ring: 'Ring',
  amulet: 'Amulet',
};

/** Ordered stat bonus lines for an item. */
export function getItemStatLines(item) {
  if (!item?.stats) return [];

  return STAT_ORDER.filter((key) => (item.stats[key] ?? 0) > 0).map((key) => ({
    key,
    label: STAT_LABELS[key] ?? key.toUpperCase(),
    value: item.stats[key],
  }));
}

export function capitalizeWord(value) {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatSlotType(slot) {
  return SLOT_LABELS[slot] ?? capitalizeWord(slot);
}

/**
 * Build inspect-panel HTML for an item.
 * @param {object} item
 * @param {{ actionHint?: string }} [options]
 */
export function buildItemInspectHtml(item, { actionHint = '' } = {}) {
  if (!item) return '';

  const color = getRarityColor(item.rarity);
  const statLines = getItemStatLines(item);
  const slotLabel = formatSlotType(item.slot ?? item.type);
  const rarityLabel = capitalizeWord(item.rarity);

  const statsHtml =
    statLines.length > 0
      ? `<ul class="item-stat-list">${statLines
          .map(
            (line) =>
              `<li><span class="item-stat-label">${line.label}</span><span class="item-stat-value">+${line.value}</span></li>`
          )
          .join('')}</ul>`
      : '<p class="item-inspect-no-stats">No stat bonuses</p>';

  const hintHtml = actionHint
    ? `<p class="item-inspect-action">${escapeHtml(actionHint)}</p>`
    : '';

  return `
    <p class="item-inspect-name" style="color: ${color}">${escapeHtml(item.name)}</p>
    <p class="item-inspect-meta">${escapeHtml(slotLabel)} · ${escapeHtml(rarityLabel)}</p>
    ${statsHtml}
    ${hintHtml}
  `;
}

export function buildEmptyInspectHtml(message = 'Hover an item for details') {
  return `<p class="item-inspect-empty">${escapeHtml(message)}</p>`;
}

export function buildSlotHintHtml(slotType) {
  if (!slotType) return buildEmptyInspectHtml();
  const label = formatSlotType(slotType);
  return `
    <p class="item-inspect-name">${escapeHtml(label)}</p>
    <p class="item-inspect-meta">Empty slot</p>
    <p class="item-inspect-action">Equip an item from your bag</p>
  `;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
