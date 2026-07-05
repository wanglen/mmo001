import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { pickupLoot, equipFromInventory, unequipSlot } from '../../../server/systems/inventory.js';
import { LootManager, resetLootIdCounter } from '../../../server/items/LootManager.js';
import { createItem, RARITY, resetItemIdCounter } from '../../../shared/items.js';
import { createPlayerStats } from '../../../shared/stats.js';
import { createEmptyInventory, createEmptyEquipment } from '../../../shared/inventory.js';

const swordTemplate = {
  name: 'Sword',
  type: 'weapon',
  slot: 'weapon',
  baseStats: { str: 2 },
};

function createMockPlayer() {
  const stats = createPlayerStats('warrior');
  return {
    characterClass: 'warrior',
    x: 100,
    y: 100,
    inventory: createEmptyInventory(),
    equipment: createEmptyEquipment(),
    ...stats,
  };
}

describe('pickupLoot', () => {
  it('adds item to inventory when in range', () => {
    resetItemIdCounter();
    resetLootIdCounter();
    const player = createMockPlayer();
    const lootManager = new LootManager();
    const item = createItem(swordTemplate, RARITY.COMMON);
    const drop = lootManager.spawn(110, 100, item);

    const result = pickupLoot({ player, lootId: drop.id, lootManager });
    assert.equal(result.ok, true);
    assert.equal(player.inventory[0].id, item.id);
    assert.equal(lootManager.get(drop.id), undefined);
  });

  it('rejects pickup out of range', () => {
    resetItemIdCounter();
    resetLootIdCounter();
    const player = createMockPlayer();
    const lootManager = new LootManager();
    const drop = lootManager.spawn(200, 200, createItem(swordTemplate, RARITY.COMMON));

    const result = pickupLoot({ player, lootId: drop.id, lootManager });
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'out_of_range');
  });
});

describe('equipFromInventory', () => {
  it('moves weapon from inventory to equipment slot', () => {
    resetItemIdCounter();
    const player = createMockPlayer();
    const item = createItem(swordTemplate, RARITY.COMMON);
    player.inventory[0] = item;

    const result = equipFromInventory(player, 0);
    assert.equal(result.ok, true);
    assert.equal(player.equipment.weapon, item);
    assert.equal(player.inventory[0], null);
    assert.ok(player.maxHp >= 120);
  });

  it('swaps with previously equipped item', () => {
    resetItemIdCounter();
    const player = createMockPlayer();
    const oldSword = createItem(swordTemplate, RARITY.COMMON);
    const newSword = createItem({ ...swordTemplate, name: 'Axe' }, RARITY.MAGIC);
    player.equipment.weapon = oldSword;
    player.inventory[0] = newSword;

    equipFromInventory(player, 0);
    assert.equal(player.equipment.weapon, newSword);
    assert.equal(player.inventory[0], oldSword);
  });
});

describe('unequipSlot', () => {
  it('moves equipped item back to inventory', () => {
    resetItemIdCounter();
    const player = createMockPlayer();
    const item = createItem(swordTemplate, RARITY.COMMON);
    player.equipment.weapon = item;

    const result = unequipSlot(player, 'weapon');
    assert.equal(result.ok, true);
    assert.equal(player.equipment.weapon, null);
    assert.equal(player.inventory[0], item);
  });
});
