export const ITEM_TYPES = {
  WEAPON: 'weapon',
  HELM: 'helm',
  CHEST: 'chest',
  GLOVES: 'gloves',
  BOOTS: 'boots',
  RING: 'ring',
  AMULET: 'amulet',
};

export const EQUIP_SLOTS = [
  'weapon',
  'helm',
  'chest',
  'gloves',
  'boots',
  'ring',
  'amulet',
];

export const RARITY = {
  COMMON: 'common',
  MAGIC: 'magic',
  RARE: 'rare',
  UNIQUE: 'unique',
};

export const RARITY_COLORS = {
  common: '#c0c0c0',
  magic: '#4169e1',
  rare: '#ffd700',
  unique: '#c87850',
};

export const RARITY_MULTIPLIER = {
  common: 1,
  magic: 1.5,
  rare: 2,
  unique: 3,
};

export const LOOT_TEMPLATES = [
  { key: 'rusty_sword', name: 'Rusty Sword', type: 'weapon', slot: 'weapon', baseStats: { str: 2 } },
  { key: 'wooden_staff', name: 'Wooden Staff', type: 'weapon', slot: 'weapon', baseStats: { int: 2 } },
  { key: 'short_bow', name: 'Short Bow', type: 'weapon', slot: 'weapon', baseStats: { dex: 2 } },
  { key: 'leather_cap', name: 'Leather Cap', type: 'helm', slot: 'helm', baseStats: { vit: 1 } },
  { key: 'leather_vest', name: 'Leather Vest', type: 'chest', slot: 'chest', baseStats: { vit: 2 } },
  { key: 'leather_gloves', name: 'Leather Gloves', type: 'gloves', slot: 'gloves', baseStats: { dex: 1 } },
  { key: 'leather_boots', name: 'Leather Boots', type: 'boots', slot: 'boots', baseStats: { dex: 1 } },
  { key: 'copper_ring', name: 'Copper Ring', type: 'ring', slot: 'ring', baseStats: { str: 1 } },
  { key: 'jade_amulet', name: 'Jade Amulet', type: 'amulet', slot: 'amulet', baseStats: { int: 1 } },
];

const DROP_CHANCE = {
  goblin: 0.35,
  skeleton: 0.45,
  bat: 0.25,
};

let itemIdCounter = 1;

/** Reset item id counter for deterministic tests. */
export function resetItemIdCounter(start = 1) {
  itemIdCounter = start;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Build an item instance from a template and rarity tier. */
export function createItem(template, rarity = RARITY.COMMON) {
  const mult = RARITY_MULTIPLIER[rarity] ?? 1;
  const stats = {};

  for (const [stat, value] of Object.entries(template.baseStats ?? {})) {
    stats[stat] = Math.max(1, Math.floor(value * mult));
  }

  const prefix = rarity === RARITY.COMMON ? '' : `${capitalize(rarity)} `;

  return {
    id: `item${itemIdCounter++}`,
    name: `${prefix}${template.name}`,
    type: template.type,
    rarity,
    slot: template.slot,
    stats,
  };
}

/** Roll Diablo-style rarity from a 0–1 value. */
export function rollRarity(random = Math.random) {
  const r = random();
  if (r < 0.55) return RARITY.COMMON;
  if (r < 0.85) return RARITY.MAGIC;
  if (r < 0.97) return RARITY.RARE;
  return RARITY.UNIQUE;
}

/** Roll a loot item for a defeated monster, or null if no drop. */
export function rollLoot(monsterType, random = Math.random) {
  if (random() > (DROP_CHANCE[monsterType] ?? 0.3)) return null;

  const templateIndex = Math.floor(random() * LOOT_TEMPLATES.length);
  const template = LOOT_TEMPLATES[templateIndex];
  const rarity = rollRarity(random);
  return createItem(template, rarity);
}

export function itemToJSON(item) {
  if (!item) return null;
  return {
    id: item.id,
    name: item.name,
    type: item.type,
    rarity: item.rarity,
    slot: item.slot,
    stats: { ...item.stats },
  };
}

export function getRarityColor(rarity) {
  return RARITY_COLORS[rarity] ?? RARITY_COLORS.common;
}
