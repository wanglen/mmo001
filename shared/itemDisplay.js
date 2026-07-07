import { getRarityColor } from './items.js';
import { isConsumable, getStackCount } from './consumables.js';
import { isGem } from './plugins/items/gems.js';
import { ITEM_SETS } from './plugins/items/sets.js';

const STAT_LABELS = {
  str: 'Strength',
  dex: 'Dexterity',
  int: 'Intelligence',
  vit: 'Vitality',
  hp: 'Life',
  mp: 'Mana',
  damagePercent: '% Damage',
};

const STAT_ORDER = ['str', 'dex', 'int', 'vit', 'hp', 'mp', 'damagePercent'];

const SLOT_LABELS = {
  weapon: 'Weapon',
  helm: 'Helm',
  chest: 'Chest',
  gloves: 'Gloves',
  boots: 'Boots',
  ring: 'Ring',
  amulet: 'Amulet',
  consumable: 'Consumable',
  gem: 'Gem',
};

/** Ordered stat bonus lines for an item. */
export function getItemStatLines(item) {
  if (!item?.stats) return [];

  return STAT_ORDER.filter((key) => (item.stats[key] ?? 0) > 0).map((key) => ({
    key,
    label: STAT_LABELS[key] ?? key.toUpperCase(),
    value: key === 'damagePercent' ? `${item.stats[key]}%` : item.stats[key],
  }));
}

/**
 * Stat lines for a candidate item with optional delta vs equipped gear.
 * @param {object} candidate
 * @param {object | null | undefined} equipped
 */
export function getStatCompareLines(candidate, equipped) {
  if (isConsumable(candidate)) return getConsumableLines(candidate);
  if (isGem(candidate)) return getGemLines(candidate);

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

  const displayValue = line.key === 'damagePercent' ? `${line.value}%` : line.value;
  const base = line.key === 'damagePercent' ? `+${displayValue}` : `+${line.value}`;
  if (line.delta == null || line.delta === 0) {
    return `<span class="item-stat-value">${base}</span>`;
  }

  const deltaText =
    line.key === 'damagePercent'
      ? `(${line.delta > 0 ? '+' : ''}${line.delta}%)`
      : line.delta > 0
        ? `(+${line.delta})`
        : `(${line.delta})`;
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

export function getGemLines(item) {
  if (!isGem(item)) return [];
  return getItemStatLines(item).map((line) => ({
    label: line.label,
    value: line.key === 'damagePercent' ? `+${line.value}` : `+${line.value}`,
  }));
}

export function getAffixLines(item) {
  return (item?.affixes ?? []).map((affix) => ({
    label: affix.label,
    value:
      affix.stat === 'damagePercent'
        ? `+${affix.value}% Damage`
        : `+${affix.value} ${STAT_LABELS[affix.stat] ?? affix.stat}`,
  }));
}

export function getSocketLines(item) {
  const sockets = item?.sockets ?? [];
  if (sockets.length === 0) return [];

  return sockets.map((socket, index) => ({
    label: `Socket ${index + 1}`,
    value: socket.gem ? socket.gem.name : 'Empty',
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
 * @param {{ actionHint?: string, compareWith?: object | null, compareHeader?: string }} [options]
 */
export function buildItemInspectHtml(item, { actionHint = '', compareWith = null, compareHeader = '' } = {}) {
  if (!item) return '';

  const color = getRarityColor(item.rarity);
  const statLines = isConsumable(item)
    ? getConsumableLines(item)
    : isGem(item)
      ? getGemLines(item)
      : getStatCompareLines(item, compareWith);
  const affixLines = getAffixLines(item);
  const socketLines = getSocketLines(item);
  const slotLabel = isConsumable(item)
    ? 'Consumable'
    : isGem(item)
      ? 'Gem'
      : formatSlotType(item.slot ?? item.type);
  const rarityLabel = capitalizeWord(item.rarity);
  const stackLabel =
    isConsumable(item) && getStackCount(item) > 1 ? ` · Stack ${getStackCount(item)}` : '';
  const showCompareHeader = !isConsumable(item) && !isGem(item) && compareWith && compareHeader;
  const setName = item.setId ? ITEM_SETS[item.setId]?.name : null;

  const statsHtml =
    statLines.length > 0
      ? `${showCompareHeader ? `<p class="item-inspect-compare-header">${escapeHtml(compareHeader)}</p>` : ''}<ul class="item-stat-list">${statLines
          .map(
            (line) =>
              `<li><span class="item-stat-label">${line.label}</span>${formatStatValue(line)}</li>`
          )
          .join('')}</ul>`
      : '<p class="item-inspect-no-stats">No stat bonuses</p>';

  const affixHtml =
    affixLines.length > 0
      ? `<ul class="item-affix-list">${affixLines
          .map(
            (line) =>
              `<li class="item-affix-line"><span class="item-affix-label">${escapeHtml(line.label)}</span> <span class="item-affix-value">${escapeHtml(String(line.value))}</span></li>`
          )
          .join('')}</ul>`
      : '';

  const socketHtml =
    socketLines.length > 0
      ? `<ul class="item-socket-list">${socketLines
          .map(
            (line) =>
              `<li><span class="item-stat-label">${escapeHtml(line.label)}</span><span class="item-stat-value">${escapeHtml(line.value)}</span></li>`
          )
          .join('')}</ul>`
      : '';

  const setHtml = setName
    ? `<p class="item-inspect-set">Set: <span class="item-inspect-set-name">${escapeHtml(setName)}</span></p>`
    : '';

  const hintHtml = actionHint
    ? `<p class="item-inspect-action">${escapeHtml(actionHint)}</p>`
    : '';

  return `
    <p class="item-inspect-name" style="color: ${color}">${escapeHtml(item.name)}</p>
    <p class="item-inspect-meta">${escapeHtml(slotLabel)} · ${escapeHtml(rarityLabel)}${escapeHtml(stackLabel)}</p>
    ${setHtml}
    ${statsHtml}
    ${affixHtml}
    ${socketHtml}
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

/**
 * Floating tooltip HTML (icon + details) for inventory/stash hover.
 * @param {object | null} item
 * @param {{ actionHint?: string, compareWith?: object | null, compareHeader?: string, iconHtml?: string }} [options]
 */
export function buildItemTooltipHtml(item, options = {}) {
  if (!item) return '';

  const { actionHint = '', compareWith = null, compareHeader = '', iconHtml = '' } = options;
  const detailsHtml = buildItemInspectHtml(item, { actionHint, compareWith, compareHeader });
  const iconBlock = iconHtml
    ? `<div class="item-tooltip-icon">${iconHtml}</div>`
    : '';

  return `<div class="item-tooltip-layout">${iconBlock}<div class="item-tooltip-details">${detailsHtml}</div></div>`;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
