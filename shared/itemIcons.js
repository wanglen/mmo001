import { LOOT_TEMPLATES, POTION_TEMPLATES } from './items.js';

const DEFAULT_ICON = 'chest';

const RARITY_PREFIXES = ['Magic ', 'Rare ', 'Unique '];

/** Strip rarity prefix from display name for legacy save matching. */
export function stripRarityPrefix(name) {
  if (!name) return '';
  for (const prefix of RARITY_PREFIXES) {
    if (name.startsWith(prefix)) return name.slice(prefix.length);
  }
  return name;
}

/** Match legacy item name to a template key when templateKey is missing. */
export function inferTemplateKeyFromName(name) {
  const baseName = stripRarityPrefix(name);
  const gear = LOOT_TEMPLATES.find((t) => t.name === baseName);
  if (gear) return gear.key;
  const potion = POTION_TEMPLATES.find((t) => t.name === baseName);
  if (potion) return potion.key;
  return null;
}

/**
 * Resolve canvas/SVG icon key for an item or empty equipment slot.
 * @param {object|null} item
 * @param {string} [fallbackSlot]
 */
export function resolveItemIconKey(item, fallbackSlot = '') {
  if (!item) return fallbackSlot || DEFAULT_ICON;

  if (item.templateKey) return item.templateKey;

  if (item.consumableKind === 'health') return 'health_potion';
  if (item.consumableKind === 'mana') return 'mana_potion';
  if (item.gemKind) return item.gemKind;
  if (item.type === 'gem') return item.templateKey ?? 'ruby';

  const inferred = inferTemplateKeyFromName(item.name);
  if (inferred) return inferred;

  return item.slot ?? item.type ?? (fallbackSlot || DEFAULT_ICON);
}
