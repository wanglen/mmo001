import { RARITY, RARITY_MULTIPLIER, POTION_TEMPLATES, LOOT_TEMPLATES } from './items.js';
import { inferTemplateKeyFromName } from './itemIcons.js';

/** Fraction of vendor buy price when selling items back. */
export const VENDOR_SELL_RATIO = 0.4;

/** Base buy prices by template key (common rarity). */
export const BASE_BUY_PRICES = {
  health_potion: 15,
  mana_potion: 18,
  rusty_sword: 40,
  wooden_staff: 40,
  short_bow: 40,
  leather_cap: 25,
  leather_vest: 35,
  leather_gloves: 20,
  leather_boots: 20,
  copper_ring: 30,
  jade_amulet: 35,
};

/** Small gold drops on monster kill (killer only). */
export const MONSTER_GOLD = {
  goblin: 2,
  skeleton: 4,
  bat: 1,
  boss: 25,
};

export function getBuyPrice(templateKey, rarity = 'common') {
  const base = BASE_BUY_PRICES[templateKey];
  if (!base) return null;
  const mult = RARITY_MULTIPLIER[rarity] ?? 1;
  return Math.max(1, Math.floor(base * mult));
}

export function resolveItemTemplateKey(item) {
  if (!item) return null;
  if (item.templateKey) return item.templateKey;
  return inferTemplateKeyFromName(item.name);
}

export function getSellPrice(item) {
  const templateKey = resolveItemTemplateKey(item);
  if (!templateKey) return 0;
  const buy = getBuyPrice(templateKey, item.rarity ?? 'common');
  if (!buy || buy <= 1) return 0;

  let sell = Math.floor(buy * VENDOR_SELL_RATIO);
  if (sell < 1) sell = 1;
  if (sell >= buy) sell = buy - 1;

  return sell >= 1 ? sell : 0;
}

export function canAffordGold(player, amount) {
  return (player?.gold ?? 0) >= amount;
}

export function addGold(player, amount) {
  if (amount <= 0) return;
  player.gold = (player.gold ?? 0) + amount;
}

export function spendGold(player, amount) {
  if (!canAffordGold(player, amount)) return false;
  player.gold -= amount;
  return true;
}

export function rollMonsterGold(monsterType) {
  const base = MONSTER_GOLD[monsterType] ?? 1;
  return base;
}

/** Stock entries sold by town vendors (common tier). */
export function getDefaultVendorStock() {
  return [
    ...POTION_TEMPLATES.map((template) => ({
      templateKey: template.key,
      kind: 'potion',
      price: BASE_BUY_PRICES[template.key] ?? 15,
    })),
    ...LOOT_TEMPLATES.slice(0, 4).map((template) => ({
      templateKey: template.key,
      kind: 'gear',
      price: BASE_BUY_PRICES[template.key] ?? 30,
    })),
  ];
}
