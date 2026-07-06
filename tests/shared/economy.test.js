import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getBuyPrice,
  getSellPrice,
  canAffordGold,
  addGold,
  spendGold,
  rollMonsterGold,
  VENDOR_SELL_RATIO,
} from '../../shared/economy.js';
import { createItem, RARITY } from '../../shared/items.js';

describe('economy', () => {
  it('computes buy and sell prices from template', () => {
    const buy = getBuyPrice('health_potion');
    assert.equal(buy, 15);
    assert.equal(getSellPrice({ templateKey: 'health_potion', rarity: 'common' }), Math.floor(buy * VENDOR_SELL_RATIO));
  });

  it('applies rarity multiplier to buy price', () => {
    const common = getBuyPrice('rusty_sword', RARITY.COMMON);
    const magic = getBuyPrice('rusty_sword', RARITY.MAGIC);
    assert.ok(magic > common);
  });

  it('tracks gold spend and afford checks', () => {
    const player = { gold: 50 };
    assert.equal(canAffordGold(player, 30), true);
    assert.equal(spendGold(player, 30), true);
    assert.equal(player.gold, 20);
    assert.equal(spendGold(player, 25), false);
    addGold(player, 10);
    assert.equal(player.gold, 30);
  });

  it('rolls monster gold by type', () => {
    assert.equal(rollMonsterGold('goblin'), 2);
    assert.equal(rollMonsterGold('unknown'), 1);
  });
});

describe('getSellPrice', () => {
  it('returns 0 for items without template key', () => {
    const item = createItem({ name: 'Mystery', type: 'misc', slot: 'weapon', baseStats: {} }, RARITY.COMMON);
    assert.equal(getSellPrice(item), 0);
  });
});
