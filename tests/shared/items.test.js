import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createItem,
  rollLoot,
  rollRarity,
  resetItemIdCounter,
  RARITY,
  getRarityColor,
} from '../../shared/items.js';

describe('items', () => {
  it('createItem applies rarity multiplier to stats', () => {
    resetItemIdCounter();
    const template = { name: 'Sword', type: 'weapon', slot: 'weapon', baseStats: { str: 2 } };
    const common = createItem(template, RARITY.COMMON);
    const rare = createItem(template, RARITY.RARE);
    assert.equal(common.stats.str, 2);
    assert.equal(rare.stats.str, 4);
    assert.ok(rare.name.includes('Rare'));
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
      if (call === 2) return 0;
      return 0.1;
    };
    const item = rollLoot('skeleton', random);
    assert.ok(item);
    assert.ok(item.slot);
  });

  it('getRarityColor returns color per tier', () => {
    assert.ok(getRarityColor('magic').startsWith('#'));
  });
});
