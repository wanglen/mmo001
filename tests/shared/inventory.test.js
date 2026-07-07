import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createEmptyInventory,
  createEmptyEquipment,
  addItemToInventory,
  findLootAt,
  isInPickupRange,
  getEquipmentBonuses,
  getEffectiveCombatStats,
  INVENTORY_SIZE,
} from '../../shared/inventory.js';
import { createItem, createPotion, POTION_TEMPLATES, RARITY, resetItemIdCounter } from '../../shared/items.js';
import { getStackCount, MAX_CONSUMABLE_STACK } from '../../shared/consumables.js';
import { createPlayerStats } from '../../shared/stats.js';

const swordTemplate = {
  name: 'Sword',
  type: 'weapon',
  slot: 'weapon',
  baseStats: { str: 3 },
};

describe('inventory', () => {
  it('createEmptyInventory has correct size', () => {
    const inv = createEmptyInventory();
    assert.equal(inv.length, INVENTORY_SIZE);
    assert.equal(inv.every((s) => s === null), true);
  });

  it('addItemToInventory fills first empty slot', () => {
    resetItemIdCounter();
    const inv = createEmptyInventory();
    const item = createItem(swordTemplate, RARITY.COMMON);
    const result = addItemToInventory(inv, item);
    assert.equal(result.ok, true);
    assert.equal(inv[0], item);
  });

  it('addItemToInventory fails when full', () => {
    const inv = createEmptyInventory().fill({ id: 'x' });
    const result = addItemToInventory(inv, { id: 'y' });
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'full');
  });

  it('addItemToInventory stacks matching potions in one slot', () => {
    resetItemIdCounter();
    const inv = createEmptyInventory();
    const potion = createPotion(POTION_TEMPLATES[0], RARITY.COMMON);

    const first = addItemToInventory(inv, potion);
    const second = addItemToInventory(inv, { ...potion, id: 'potion-copy' });

    assert.equal(first.ok, true);
    assert.equal(second.ok, true);
    assert.equal(second.stacked, true);
    assert.equal(getStackCount(inv[0]), 2);
    assert.equal(inv[1], null);
  });

  it('addItemToInventory splits potions across slots at max stack size', () => {
    resetItemIdCounter();
    const inv = createEmptyInventory();
    const potion = createPotion(POTION_TEMPLATES[0], RARITY.COMMON);

    inv[0] = { ...potion, stackCount: MAX_CONSUMABLE_STACK };
    const result = addItemToInventory(inv, potion);

    assert.equal(result.ok, true);
    assert.equal(getStackCount(inv[0]), MAX_CONSUMABLE_STACK);
    assert.equal(getStackCount(inv[1]), 1);
  });

  it('findLootAt picks nearest drop under cursor', () => {
    const drops = [
      { id: 'l1', x: 100, y: 100, item: {} },
      { id: 'l2', x: 105, y: 100, item: {} },
    ];
    const found = findLootAt(drops, 104, 100);
    assert.equal(found.id, 'l2');
  });

  it('isInPickupRange checks distance threshold', () => {
    assert.equal(isInPickupRange(0, 0, 30, 0), true);
    assert.equal(isInPickupRange(0, 0, 50, 0), false);
  });

  it('getEquipmentBonuses sums stat bonuses', () => {
    resetItemIdCounter();
    const equipment = createEmptyEquipment();
    equipment.weapon = createItem(swordTemplate, RARITY.COMMON);
    const bonuses = getEquipmentBonuses(equipment);
    assert.equal(bonuses.str, 3);
  });

  it('getEffectiveCombatStats applies equipment to player', () => {
    resetItemIdCounter();
    const stats = createPlayerStats('warrior');
    const player = { characterClass: 'warrior', ...stats };
    const equipment = createEmptyEquipment();
    equipment.weapon = createItem(swordTemplate, RARITY.COMMON);
    const effective = getEffectiveCombatStats(player, equipment);
    assert.ok(effective.str > player.str);
    assert.ok(effective.maxHp >= stats.maxHp);
  });
});
