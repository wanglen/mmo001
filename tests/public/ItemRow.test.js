import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildItemInfoHtml, buildItemRowHtml, getItemTypeLabel } from '../../shared/itemRow.js';

describe('ItemRow', () => {
  it('buildItemInfoHtml includes rarity color and meta', () => {
    const html = buildItemInfoHtml('Health Potion', 'common', 'Consumable');
    assert.match(html, /Health Potion/);
    assert.match(html, /Consumable · Common/);
  });

  it('buildItemRowHtml renders price and action button', () => {
    const html = buildItemRowHtml({
      name: 'Sword',
      rarity: 'rare',
      typeLabel: 'Weapon',
      price: 50,
      action: { attr: 'buy', value: 'iron_sword', label: 'Buy' },
    });
    assert.match(html, /50g/);
    assert.match(html, /data-buy="iron_sword"/);
    assert.match(html, />Buy</);
  });

  it('getItemTypeLabel detects consumables', () => {
    assert.equal(getItemTypeLabel({ kind: 'potion' }), 'Consumable');
    assert.equal(getItemTypeLabel({ slot: 'weapon' }), 'Weapon');
  });
});
