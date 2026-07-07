import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createItem,
  createPotion,
  rollLoot,
  rollRarity,
  resetItemIdCounter,
  RARITY,
  POTION_TEMPLATES,
  getRarityColor,
} from '../../shared/items.js';

describe('items', () => {
  it('createItem applies rarity multiplier to stats', () => {
    resetItemIdCounter();
    const template = { key: 'rusty_sword', name: 'Sword', type: 'weapon', slot: 'weapon', baseStats: { str: 2 } };
    const common = createItem(template, RARITY.COMMON);
    const magic = createItem(template, RARITY.MAGIC, { random: () => 0.99 });
    assert.equal(common.stats.str, 2);
    assert.ok(magic.stats.str >= 2);
    assert.ok(magic.affixes?.length >= 1);
  });

  it('rollRarity returns valid tier', () => {
    const rarity = rollRarity(() => 0.9);
    assert.equal(rarity, RARITY.RARE);
  });

  it('rollLoot returns null when drop roll fails', () => {
    resetItemIdCounter();
    const item = rollLoot('bat', () => 1);
    assert.equal(item, null);
  });

  it('rollLoot returns item when drop roll succeeds', () => {
    resetItemIdCounter();
    let call = 0;
    const random = () => {
      call += 1;
      if (call === 1) return 0;
      if (call === 2) return 0.5;
      if (call === 3) return 0.99;
      if (call === 4) return 0;
      return 0.1;
    };
    const item = rollLoot('skeleton', random);
    assert.ok(item);
    assert.ok(item.slot);
  });

  it('rollLoot can drop health and mana potions', () => {
    resetItemIdCounter();
    let call = 0;
    const random = () => {
      call += 1;
      if (call === 1) return 0;
      if (call === 2) return 0.5;
      if (call === 3) return 0;
      return 0.5;
    };
    const item = rollLoot('goblin', random);
    assert.equal(item.type, 'consumable');
    assert.ok(item.consumableKind === 'health' || item.consumableKind === 'mana');
    assert.ok(item.restoreAmount >= 1);
  });

  it('createPotion scales restore with rarity', () => {
    resetItemIdCounter();
    const common = createPotion(POTION_TEMPLATES[0], RARITY.COMMON);
    const rare = createPotion(POTION_TEMPLATES[0], RARITY.RARE);
    assert.equal(common.templateKey, 'health_potion');
    assert.equal(common.restoreAmount, 50);
    assert.equal(rare.restoreAmount, 100);
  });

  it('rollLoot always drops for bosses with boosted rarity chance', () => {
    resetItemIdCounter();
    let call = 0;
    const random = () => {
      call += 1;
      if (call === 1) return 0;
      if (call === 2) return 0.99;
      if (call === 3) return 0;
      if (call === 4) return 0.1;
      return 0.5;
    };
    const item = rollLoot('goblin', random, { isBoss: true });
    assert.ok(item);
  });

  it('getRarityColor returns color per tier', () => {
    assert.ok(getRarityColor('magic').startsWith('#'));
  });
});
