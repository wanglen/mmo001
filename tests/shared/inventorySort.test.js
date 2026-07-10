import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createEmptyInventory, INVENTORY_SIZE } from '../../shared/inventory.js';
import { createItem, createPotion, POTION_TEMPLATES, RARITY, resetItemIdCounter } from '../../shared/items.js';
import { createGem, GEM_KIND } from '../../shared/plugins/items/gems.js';
import { sortInventorySlots, compareInventoryItems } from '../../shared/inventorySort.js';

const swordTemplate = {
  key: 'rusty_sword',
  name: 'Rusty Sword',
  type: 'weapon',
  slot: 'weapon',
  baseStats: { str: 2 },
};

const helmTemplate = {
  key: 'leather_cap',
  name: 'Leather Cap',
  type: 'helm',
  slot: 'helm',
  baseStats: { vit: 1 },
};

describe('inventorySort', () => {
  it('sortInventorySlots groups equipment before consumables and gems', () => {
    resetItemIdCounter();
    const inv = createEmptyInventory();
    const gem = createGem(GEM_KIND.RUBY);
    const potion = createPotion(POTION_TEMPLATES[0], RARITY.COMMON);
    const sword = createItem(swordTemplate, RARITY.COMMON);
    const rareSword = createItem(swordTemplate, RARITY.RARE);
    inv[0] = gem;
    inv[1] = potion;
    inv[3] = sword;
    inv[5] = rareSword;

    const sorted = sortInventorySlots(inv);

    assert.equal(sorted.filter(Boolean).length, 4);
    assert.equal(sorted[0], rareSword);
    assert.equal(sorted[1], sword);
    assert.equal(sorted[2], potion);
    assert.equal(sorted[3], gem);
    assert.equal(sorted.slice(4).every((slot) => slot === null), true);
    assert.equal(sorted.length, INVENTORY_SIZE);
  });

  it('compareInventoryItems orders higher rarity first within slot type', () => {
    resetItemIdCounter();
    const common = createItem(helmTemplate, RARITY.COMMON);
    const magic = createItem(helmTemplate, RARITY.MAGIC);
    assert.ok(compareInventoryItems(magic, common) < 0);
    assert.ok(compareInventoryItems(common, magic) > 0);
  });

  it('sortInventorySlots preserves item count', () => {
    resetItemIdCounter();
    const inv = createEmptyInventory();
    inv[2] = createItem(swordTemplate, RARITY.COMMON);
    inv[7] = createPotion(POTION_TEMPLATES[1], RARITY.MAGIC);
    inv[15] = createGem(GEM_KIND.RUNE);

    const sorted = sortInventorySlots(inv);
    assert.equal(sorted.filter(Boolean).length, 3);
  });
});
