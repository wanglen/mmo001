import { getRarityColor } from './items.js';
import { isConsumable } from './consumables.js';

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
  consumable: 'Consumable',
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

/**
 * Stat lines for a candidate item with optional delta vs equipped gear.
 * @param {object} candidate
 * @param {object | null | undefined} equipped
 */
export function getStatCompareLines(candidate, equipped) {
  if (isConsumable(candidate)) return getConsumableLines(candidate);

  const candidateStats = candidate?.stats ?? {};
  const equippedStats = equipped?.stats ?? {};
  const keys = STAT_ORDER.filter(
    (key) => (candidateStats[key] ?? 0) > 0 || (equippedStats[key] ?? 0) > 0
  );

  return keys.map((key) => {
    const value = candidateStats[key] ?? 0;
    const equippedValue = equippedStats[key] ?? 0;
    return {
      key,
      label: STAT_LABELS[key] ?? key.toUpperCase(),
      value,
      delta: equipped ? value - equippedValue : null,
    };
  });
}

function formatStatValue(line) {
  if (typeof line.value === 'string') {
    return `<span class="item-stat-value">${escapeHtml(String(line.value))}</span>`;
  }

  const base = `+${line.value}`;
  if (line.delta == null || line.delta === 0) {
    return `<span class="item-stat-value">${base}</span>`;
  }

  const deltaText = line.delta > 0 ? `(+${line.delta})` : `(${line.delta})`;
  const deltaClass = line.delta > 0 ? 'item-stat-delta--up' : 'item-stat-delta--down';
  return `<span class="item-stat-value">${base} <span class="item-stat-delta ${deltaClass}">${deltaText}</span></span>`;
}

/** Restore amount lines for potions and other consumables. */
export function getConsumableLines(item) {
  if (!isConsumable(item)) return [];

  if (item.consumableKind === 'health') {
    return [{ label: 'Restores', value: `${item.restoreAmount} HP` }];
  }
  if (item.consumableKind === 'mana') {
    return [{ label: 'Restores', value: `${item.restoreAmount} MP` }];
  }
  return [];
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
 * @param {{ actionHint?: string, compareWith?: object | null, compareHeader?: string }} [options]
 */
export function buildItemInspectHtml(item, { actionHint = '', compareWith = null, compareHeader = '' } = {}) {
  if (!item) return '';

  const color = getRarityColor(item.rarity);
  const statLines = isConsumable(item)
    ? getConsumableLines(item)
    : getStatCompareLines(item, compareWith);
  const slotLabel = isConsumable(item)
    ? 'Consumable'
    : formatSlotType(item.slot ?? item.type);
  const rarityLabel = capitalizeWord(item.rarity);
  const showCompareHeader = !isConsumable(item) && compareWith && compareHeader;

  const statsHtml =
    statLines.length > 0
      ? `${showCompareHeader ? `<p class="item-inspect-compare-header">${escapeHtml(compareHeader)}</p>` : ''}<ul class="item-stat-list">${statLines
          .map(
            (line) =>
              `<li><span class="item-stat-label">${line.label}</span>${formatStatValue(line)}</li>`
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
