import { RARITY } from '../../items.js';

export const AFFIX_KIND = {
  PREFIX: 'prefix',
  SUFFIX: 'suffix',
};

/** @type {Array<{ id: string, kind: string, label: string, stat: string, min: number, max: number }>} */
export const AFFIX_POOL = [
  { id: 'mighty', kind: AFFIX_KIND.PREFIX, label: 'Mighty', stat: 'str', min: 2, max: 5 },
  { id: 'keen', kind: AFFIX_KIND.PREFIX, label: 'Keen', stat: 'dex', min: 2, max: 5 },
  { id: 'arcane', kind: AFFIX_KIND.PREFIX, label: 'Arcane', stat: 'int', min: 2, max: 5 },
  { id: 'stout', kind: AFFIX_KIND.PREFIX, label: 'Stout', stat: 'vit', min: 2, max: 5 },
  { id: 'vicious', kind: AFFIX_KIND.PREFIX, label: 'Vicious', stat: 'damagePercent', min: 5, max: 12 },
  { id: 'of_the_bear', kind: AFFIX_KIND.SUFFIX, label: 'of the Bear', stat: 'str', min: 2, max: 6 },
  { id: 'of_the_eagle', kind: AFFIX_KIND.SUFFIX, label: 'of the Eagle', stat: 'dex', min: 2, max: 6 },
  { id: 'of_the_mind', kind: AFFIX_KIND.SUFFIX, label: 'of the Mind', stat: 'int', min: 2, max: 6 },
  { id: 'of_vitality', kind: AFFIX_KIND.SUFFIX, label: 'of Vitality', stat: 'vit', min: 2, max: 6 },
  { id: 'of_life', kind: AFFIX_KIND.SUFFIX, label: 'of Life', stat: 'hp', min: 8, max: 25 },
  { id: 'of_the_serpent', kind: AFFIX_KIND.SUFFIX, label: 'of the Serpent', stat: 'mp', min: 8, max: 20 },
  { id: 'of_carnage', kind: AFFIX_KIND.SUFFIX, label: 'of Carnage', stat: 'damagePercent', min: 6, max: 15 },
];

/**
 * @param {string} rarity
 * @param {() => number} [random]
 * @returns {object[]}
 */
export function rollAffixes(rarity, random = Math.random) {
  if (rarity === RARITY.COMMON || rarity === RARITY.UNIQUE) return [];

  const count =
    rarity === RARITY.MAGIC
      ? 1 + (random() < 0.55 ? 1 : 0)
      : 3 + (random() < 0.45 ? 1 : 0);

  const prefixes = AFFIX_POOL.filter((entry) => entry.kind === AFFIX_KIND.PREFIX);
  const suffixes = AFFIX_POOL.filter((entry) => entry.kind === AFFIX_KIND.SUFFIX);
  const picked = [];
  const usedIds = new Set();

  for (let i = 0; i < count; i++) {
    const wantPrefix = i % 2 === 0 && prefixes.length > 0;
    const pool = wantPrefix ? prefixes : suffixes;
    const candidates = pool.filter((entry) => !usedIds.has(entry.id));
    if (candidates.length === 0) break;

    const affix = candidates[Math.floor(random() * candidates.length)];
    usedIds.add(affix.id);
    const value = affix.min + Math.floor(random() * (affix.max - affix.min + 1));
    picked.push({
      id: affix.id,
      kind: affix.kind,
      label: affix.label,
      stat: affix.stat,
      value,
    });
  }

  return picked;
}

/** @param {string} baseName @param {object[]} affixes */
export function buildAffixedName(baseName, affixes = []) {
  const prefixes = affixes.filter((a) => a.kind === AFFIX_KIND.PREFIX).map((a) => a.label);
  const suffixes = affixes.filter((a) => a.kind === AFFIX_KIND.SUFFIX).map((a) => a.label);
  return [...prefixes, baseName, ...suffixes].join(' ').trim();
}

/** @param {object[]} affixes @returns {Record<string, number>} */
export function affixesToStats(affixes = []) {
  const stats = {};
  for (const affix of affixes) {
    stats[affix.stat] = (stats[affix.stat] ?? 0) + affix.value;
  }
  return stats;
}
