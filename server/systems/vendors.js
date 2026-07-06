import { addItemToInventory } from '../../shared/inventory.js';
import {
  createItem,
  createPotion,
  POTION_TEMPLATES,
  LOOT_TEMPLATES,
  RARITY,
} from '../../shared/items.js';
import {
  addGold,
  canAffordGold,
  getBuyPrice,
  getDefaultVendorStock,
  getSellPrice,
  spendGold,
} from '../../shared/economy.js';
import { getVendor, getVendorIdForNpc, isVendorNpc } from '../../shared/vendors.js';
import { isNearNpc } from '../../shared/npcs.js';

function findTemplate(templateKey) {
  return (
    POTION_TEMPLATES.find((entry) => entry.key === templateKey) ??
    LOOT_TEMPLATES.find((entry) => entry.key === templateKey) ??
    null
  );
}

function createStockItem(templateKey) {
  const potion = POTION_TEMPLATES.find((entry) => entry.key === templateKey);
  if (potion) return createPotion(potion, RARITY.COMMON);
  const gear = LOOT_TEMPLATES.find((entry) => entry.key === templateKey);
  if (gear) return createItem(gear, RARITY.COMMON);
  return null;
}

export function getVendorCatalog(vendorId) {
  const vendor = getVendor(vendorId);
  if (!vendor) return null;

  const stock = getDefaultVendorStock();
  return {
    vendorId,
    name: vendor.name,
    greeting: vendor.greeting,
    stock: stock.map((entry) => ({
      templateKey: entry.templateKey,
      kind: entry.kind,
      price: entry.price,
      name: findTemplate(entry.templateKey)?.name ?? entry.templateKey,
    })),
  };
}

export function buyFromVendor(player, vendorId, templateKey) {
  const catalog = getVendorCatalog(vendorId);
  if (!catalog) return { ok: false, reason: 'unknown_vendor' };

  const entry = catalog.stock.find((row) => row.templateKey === templateKey);
  if (!entry) return { ok: false, reason: 'not_in_stock' };

  const price = entry.price ?? getBuyPrice(templateKey);
  if (!price || !canAffordGold(player, price)) return { ok: false, reason: 'not_enough_gold' };

  const item = createStockItem(templateKey);
  if (!item) return { ok: false, reason: 'invalid_item' };

  const result = addItemToInventory(player.inventory, item);
  if (!result.ok) return result;

  spendGold(player, price);
  return { ok: true, index: result.index, goldSpent: price };
}

export function sellToVendor(player, inventoryIndex) {
  if (!Number.isInteger(inventoryIndex) || inventoryIndex < 0 || inventoryIndex >= player.inventory.length) {
    return { ok: false, reason: 'invalid_index' };
  }

  const item = player.inventory[inventoryIndex];
  if (!item) return { ok: false, reason: 'empty_slot' };

  const price = getSellPrice(item);
  if (price <= 0) return { ok: false, reason: 'unsellable' };

  player.inventory[inventoryIndex] = null;
  addGold(player, price);
  return { ok: true, goldGained: price };
}

export function validateVendorInteraction(player, npcs, npcId) {
  const npc = npcs.find((entry) => entry.id === npcId);
  if (!npc || !isVendorNpc(npc)) return { ok: false, reason: 'not_vendor' };
  if (!isNearNpc(player.x, player.y, npc)) return { ok: false, reason: 'out_of_range' };

  const vendorId = getVendorIdForNpc(npc);
  const catalog = getVendorCatalog(vendorId);
  if (!catalog) return { ok: false, reason: 'unknown_vendor' };

  return { ok: true, vendorId, catalog };
}
