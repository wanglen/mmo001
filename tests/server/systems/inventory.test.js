import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { pickupLoot, equipFromInventory, unequipSlot, useConsumableFromInventory } from '../../../server/systems/inventory.js';
import { LootManager, resetLootIdCounter } from '../../../server/items/LootManager.js';
import { createItem, createPotion, POTION_TEMPLATES, RARITY, resetItemIdCounter } from '../../../shared/items.js';
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

describe('useConsumableFromInventory', () => {
  it('consumes potion and restores hp', () => {
    resetItemIdCounter();
    const player = createMockPlayer();
    player.hp = 40;
    const potion = createPotion(POTION_TEMPLATES[0], RARITY.COMMON);
    player.inventory[2] = potion;

    const result = useConsumableFromInventory(player, 2);

    assert.equal(result.ok, true);
    assert.equal(result.kind, 'health');
    assert.ok(player.hp > 40);
    assert.equal(player.inventory[2], null);
  });

  it('rejects use when hp is full', () => {
    resetItemIdCounter();
    const player = createMockPlayer();
    player.hp = player.maxHp;
    player.inventory[0] = createPotion(POTION_TEMPLATES[0], RARITY.COMMON);

    const result = useConsumableFromInventory(player, 0);
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'full_hp');
    assert.ok(player.inventory[0]);
  });
});
