import { ITEM_TYPES } from '../../items.js';

export const GEM_KIND = {
  RUBY: 'ruby',
  SAPPHIRE: 'sapphire',
  EMERALD: 'emerald',
  DIAMOND: 'diamond',
  RUNE: 'rune',
};

/** @type {Record<string, { key: string, name: string, stats: Record<string, number> }>} */
export const GEM_TEMPLATES = {
  [GEM_KIND.RUBY]: { key: 'ruby', name: 'Ruby', stats: { str: 3 } },
  [GEM_KIND.SAPPHIRE]: { key: 'sapphire', name: 'Sapphire', stats: { int: 3 } },
  [GEM_KIND.EMERALD]: { key: 'emerald', name: 'Emerald', stats: { dex: 3 } },
  [GEM_KIND.DIAMOND]: { key: 'diamond', name: 'Diamond', stats: { vit: 3 } },
  [GEM_KIND.RUNE]: { key: 'rune', name: 'Rune of Power', stats: { damagePercent: 8 } },
};

const GEM_KINDS = Object.values(GEM_KIND);

let gemIdCounter = 1;

export function resetGemIdCounter(start = 1) {
  gemIdCounter = start;
}

/**
 * @param {string} kind
 * @param {number} [id]
 */
export function createGem(kind, id = gemIdCounter++) {
  const template = GEM_TEMPLATES[kind];
  if (!template) return null;

  return {
    id: `gem${id}`,
    name: template.name,
    templateKey: template.key,
    type: ITEM_TYPES.GEM,
    gemKind: kind,
    stats: { ...template.stats },
  };
}

/** @param {() => number} [random] */
export function rollGemKind(random = Math.random) {
  const index = Math.floor(random() * GEM_KINDS.length);
  return GEM_KINDS[index];
}

export function isGem(item) {
  return item?.type === ITEM_TYPES.GEM;
}
