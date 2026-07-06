import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buyFromVendor, sellToVendor, validateVendorInteraction } from '../../../server/systems/vendors.js';
import { VENDOR_ID } from '../../../shared/vendors.js';
import { createEmptyInventory } from '../../../shared/inventory.js';
import { createPlayerStats } from '../../../shared/stats.js';
import { createItem, createPotion, POTION_TEMPLATES, RARITY, ITEM_TYPES } from '../../../shared/items.js';
import { NPC_ROLE } from '../../../shared/npcs.js';

function createPlayer(overrides = {}) {
  return {
    x: 100,
    y: 100,
    gold: 100,
    inventory: createEmptyInventory(),
    ...createPlayerStats('warrior'),
    ...overrides,
  };
}

const vendorNpc = {
  id: 'merchant-brok',
  role: NPC_ROLE.VENDOR,
  vendorId: VENDOR_ID.TOWN_MERCHANT,
  x: 100,
  y: 100,
};

describe('vendors', () => {
  it('validates vendor interaction in range', () => {
    const player = createPlayer();
    const check = validateVendorInteraction(player, [vendorNpc], vendorNpc.id);
    assert.equal(check.ok, true);
    assert.ok(check.catalog?.stock?.length);
    const potion = check.catalog.stock.find((row) => row.templateKey === 'health_potion');
    assert.equal(potion.rarity, 'common');
    assert.equal(potion.type, 'consumable');
    const sword = check.catalog.stock.find((row) => row.templateKey === 'rusty_sword');
    assert.equal(sword.type, 'weapon');
    assert.equal(sword.slot, 'weapon');
  });

  it('allows buy/sell validation without range when panel is open', () => {
    const player = createPlayer({ x: 0, y: 0 });
    const check = validateVendorInteraction(player, [vendorNpc], vendorNpc.id, {
      requireRange: false,
    });
    assert.equal(check.ok, true);
  });

  it('buys potion and deducts gold', () => {
    const player = createPlayer({ gold: 50 });
    const result = buyFromVendor(player, VENDOR_ID.TOWN_MERCHANT, 'health_potion');
    assert.equal(result.ok, true);
    assert.ok(player.inventory.some((slot) => slot?.type === ITEM_TYPES.CONSUMABLE));
    assert.ok(player.gold < 50);
  });

  it('sells inventory item for gold', () => {
    const player = createPlayer({ gold: 0 });
    player.inventory[0] = createPotion(POTION_TEMPLATES[0], RARITY.COMMON);
    const result = sellToVendor(player, 0);
    assert.equal(result.ok, true);
    assert.equal(player.inventory[0], null);
    assert.ok(player.gold > 0);
  });
});
