import { RARITY, RARITY_MULTIPLIER } from '../../items.js';
import { rollAffixes, buildAffixedName, affixesToStats } from './affixes.js';
import { rollSocketCount, createEmptySockets } from './sockets.js';
import { getSetForTemplate } from './sets.js';

/**
 * Apply magic/rare affixes, sockets, and optional set tagging to a gear item.
 *
 * @param {object} item — base item from createItem (mutated in place)
 * @param {object} template
 * @param {object} [options]
 * @param {() => number} [options.random]
 * @param {boolean} [options.forceSet]
 */
export function enhanceGearItem(item, template, options = {}) {
  const { random = Math.random, forceSet = false } = options;

  if (item.rarity === RARITY.COMMON || item.type === 'consumable') return item;

  const affixes = rollAffixes(item.rarity, random);
  const affixStats = affixesToStats(affixes);

  for (const [stat, value] of Object.entries(affixStats)) {
    item.stats[stat] = (item.stats[stat] ?? 0) + value;
  }

  item.affixes = affixes;
  item.name = buildAffixedName(template.name, affixes);

  const socketCount = rollSocketCount(item.rarity, random);
  if (socketCount > 0) {
    item.sockets = createEmptySockets(socketCount);
  }

  const setId = getSetForTemplate(template.key);
  if (setId && (forceSet || random() < 0.1)) {
    item.setId = setId;
  }

  return item;
}

/**
 * Rebuild base stats from template + rarity, then affixes (for tests).
 * @param {object} template
 * @param {string} rarity
 */
export function buildBaseGearStats(template, rarity) {
  const mult = RARITY_MULTIPLIER[rarity] ?? 1;
  const stats = {};
  for (const [stat, value] of Object.entries(template.baseStats ?? {})) {
    stats[stat] = Math.max(1, Math.floor(value * mult));
  }
  return stats;
}
