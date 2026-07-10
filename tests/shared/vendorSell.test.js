import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createEmptyInventory } from '../../shared/inventory.js';
import { createItem, createPotion, LOOT_TEMPLATES, POTION_TEMPLATES, RARITY } from '../../shared/items.js';
import { getSellPrice } from '../../shared/economy.js';
import {
  buildVendorSellRows,
  buildVendorSellSignature,
  sellPotionsToVendor,
} from '../../shared/vendorSell.js';

describe('vendorSell', () => {
  it('groups potions by template and rarity across bag slots', () => {
    const inventory = createEmptyInventory();
    inventory[0] = createPotion(POTION_TEMPLATES[0], RARITY.COMMON);
    inventory[0].stackCount = 5;
    inventory[3] = createPotion(POTION_TEMPLATES[0], RARITY.COMMON);
    inventory[3].stackCount = 7;
    inventory[5] = createItem(LOOT_TEMPLATES[0], RARITY.COMMON);

    const rows = buildVendorSellRows(inventory);
    const potionRow = rows.find((row) => row.kind === 'potion_stack');
    const gearRow = rows.find((row) => row.kind === 'slot');

    assert.equal(potionRow?.totalCount, 12);
    assert.equal(potionRow?.templateKey, 'health_potion');
    assert.equal(gearRow?.index, 5);
  });

  it('builds a stable signature from grouped sell rows', () => {
    const inventory = createEmptyInventory();
    inventory[0] = createPotion(POTION_TEMPLATES[0], RARITY.COMMON);
    inventory[0].stackCount = 2;

    const first = buildVendorSellSignature(inventory);
    inventory[0].stackCount = 3;
    const second = buildVendorSellSignature(inventory);

    assert.notEqual(first, second);
    assert.match(first, /health_potion:common:2/);
  });

  it('sells a partial quantity from stacked potion slots', () => {
    const player = {
      gold: 0,
      inventory: createEmptyInventory(),
    };
    player.inventory[0] = createPotion(POTION_TEMPLATES[0], RARITY.COMMON);
    player.inventory[0].stackCount = 5;
    player.inventory[2] = createPotion(POTION_TEMPLATES[0], RARITY.COMMON);
    player.inventory[2].stackCount = 4;

    const unitPrice = getSellPrice(player.inventory[0]);
    const result = sellPotionsToVendor(player, 'health_potion', 6, RARITY.COMMON);

    assert.equal(result.ok, true);
    assert.equal(result.quantitySold, 6);
    assert.equal(result.goldGained, unitPrice * 6);
    assert.equal(player.inventory[0], null);
    assert.equal(player.inventory[2]?.stackCount, 3);
  });

  it('rejects selling more potions than available', () => {
    const player = {
      gold: 0,
      inventory: createEmptyInventory(),
    };
    player.inventory[0] = createPotion(POTION_TEMPLATES[0], RARITY.COMMON);
    player.inventory[0].stackCount = 2;

    const result = sellPotionsToVendor(player, 'health_potion', 5, RARITY.COMMON);

    assert.equal(result.ok, false);
    assert.equal(result.reason, 'not_enough');
    assert.equal(player.inventory[0]?.stackCount, 2);
  });
});
