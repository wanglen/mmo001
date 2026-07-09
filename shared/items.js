import { enhanceGearItem } from './plugins/items/rollGear.js';
import { createGem, rollGemKind } from './plugins/items/gems.js';

export const ITEM_TYPES = {
  WEAPON: 'weapon',
  HELM: 'helm',
  CHEST: 'chest',
  GLOVES: 'gloves',
  BOOTS: 'boots',
  RING: 'ring',
  AMULET: 'amulet',
  CONSUMABLE: 'consumable',
  GEM: 'gem',
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

/** Health / mana potions — dropped as loot and used from inventory. */
export const POTION_TEMPLATES = [
  { key: 'health_potion', name: 'Health Potion', consumableKind: 'health', baseRestore: 50 },
  { key: 'mana_potion', name: 'Mana Potion', consumableKind: 'mana', baseRestore: 45 },
];

/** When a drop succeeds, chance the item is a potion instead of gear. */
export const POTION_LOOT_WEIGHT = 0.38;

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
export function createItem(template, rarity = RARITY.COMMON, options = {}) {
  const mult = RARITY_MULTIPLIER[rarity] ?? 1;
  const stats = {};

  for (const [stat, value] of Object.entries(template.baseStats ?? {})) {
    stats[stat] = Math.max(1, Math.floor(value * mult));
  }

  const prefix = rarity === RARITY.COMMON ? '' : `${capitalize(rarity)} `;

  const item = {
    id: `item${itemIdCounter++}`,
    name: `${prefix}${template.name}`,
    templateKey: template.key,
    type: template.type,
    rarity,
    slot: template.slot,
    stats,
  };

  if (rarity !== RARITY.COMMON) {
    enhanceGearItem(item, template, options);
  }

  return item;
}

/** Build a consumable potion instance. */
export function createPotion(template, rarity = RARITY.COMMON) {
  const mult = RARITY_MULTIPLIER[rarity] ?? 1;
  const restoreAmount = Math.max(1, Math.floor((template.baseRestore ?? 1) * mult));
  const prefix = rarity === RARITY.COMMON ? '' : `${capitalize(rarity)} `;

  return {
    id: `item${itemIdCounter++}`,
    name: `${prefix}${template.name}`,
    templateKey: template.key,
    type: ITEM_TYPES.CONSUMABLE,
    consumableKind: template.consumableKind,
    rarity,
    restoreAmount,
    stackCount: 1,
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
export function rollLoot(monsterType, random = Math.random, options = {}) {
  const { isBoss = false, isElite = false } = options;
  let dropChance = DROP_CHANCE[monsterType] ?? 0.3;
  if (isBoss) dropChance = 1;
  else if (isElite) dropChance = Math.min(1, dropChance * 1.5);

  if (random() > dropChance) return null;

  if (random() < 0.08) {
    return createGem(rollGemKind(random));
  }

  if (random() < POTION_LOOT_WEIGHT) {
    const template = POTION_TEMPLATES[Math.floor(random() * POTION_TEMPLATES.length)];
    return createPotion(template, rollRarityForLoot(random, { isBoss, isElite }));
  }

  const templateIndex = Math.floor(random() * LOOT_TEMPLATES.length);
  const template = LOOT_TEMPLATES[templateIndex];
  const rarity = rollRarityForLoot(random, { isBoss, isElite });
  return createItem(template, rarity, { random, forceSet: isBoss && random() < 0.35 });
}

/** Roll loot for an opened dungeon chest (always returns an item or gold grant). */
export function rollChestLoot(random = Math.random) {
  if (random() < 0.22) {
    return { kind: 'gold', gold: 8 + Math.floor(random() * 18) };
  }

  if (random() < 0.5) {
    const template = POTION_TEMPLATES[Math.floor(random() * POTION_TEMPLATES.length)];
    return { kind: 'item', item: createPotion(template, rollRarity(random)) };
  }

  if (random() < 0.08) {
    return { kind: 'item', item: createGem(rollGemKind(random)) };
  }

  const template = LOOT_TEMPLATES[Math.floor(random() * LOOT_TEMPLATES.length)];
  return { kind: 'item', item: createItem(template, rollRarity(random), { random }) };
}

function rollRarityForLoot(random, { isBoss = false, isElite = false } = {}) {
  if (isBoss && random() < 0.4) {
    return random() < 0.15 ? RARITY.UNIQUE : RARITY.RARE;
  }
  if (isElite && random() < 0.25) {
    return RARITY.MAGIC;
  }
  return rollRarity(random);
}

export function itemToJSON(item) {
  if (!item) return null;
  const json = {
    id: item.id,
    name: item.name,
    templateKey: item.templateKey,
    type: item.type,
    rarity: item.rarity,
    slot: item.slot,
    stats: item.stats ? { ...item.stats } : undefined,
    affixes: item.affixes?.map((affix) => ({ ...affix })),
    sockets: item.sockets?.map((socket) => ({
      gem: socket.gem ? itemToJSON(socket.gem) : null,
    })),
    setId: item.setId,
    gemKind: item.gemKind,
    stackCount: (item.stackCount ?? 1) > 1 ? item.stackCount : undefined,
    consumableKind: item.consumableKind,
    restoreAmount: item.restoreAmount,
  };
  if (!json.templateKey) delete json.templateKey;
  if (!json.stats) delete json.stats;
  if (!json.slot) delete json.slot;
  if (!json.affixes?.length) delete json.affixes;
  if (!json.sockets?.length) delete json.sockets;
  if (!json.setId) delete json.setId;
  if (!json.gemKind) delete json.gemKind;
  if (json.stackCount == null || json.stackCount <= 1) delete json.stackCount;
  if (!json.consumableKind) delete json.consumableKind;
  if (json.restoreAmount == null) delete json.restoreAmount;
  return json;
}

export function getRarityColor(rarity) {
  return RARITY_COLORS[rarity] ?? RARITY_COLORS.common;
}
