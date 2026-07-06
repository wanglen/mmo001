import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getItemStatLines,
  getStatCompareLines,
  buildItemInspectHtml,
  formatSlotType,
} from '../../shared/itemDisplay.js';

describe('itemDisplay', () => {
  it('getItemStatLines returns ordered stat bonuses', () => {
    const lines = getItemStatLines({
      stats: { dex: 2, str: 3, int: 0 },
    });

    assert.deepEqual(lines, [
      { key: 'str', label: 'Strength', value: 3 },
      { key: 'dex', label: 'Dexterity', value: 2 },
    ]);
  });

  it('getItemStatLines returns empty for missing stats', () => {
    assert.deepEqual(getItemStatLines(null), []);
    assert.deepEqual(getItemStatLines({ stats: {} }), []);
  });

  it('buildItemInspectHtml includes name, rarity, and stat rows', () => {
    const html = buildItemInspectHtml({
      name: 'Rusty Sword',
      rarity: 'magic',
      slot: 'weapon',
      stats: { str: 2 },
    });

    assert.ok(html.includes('Rusty Sword'));
    assert.ok(html.includes('Weapon'));
    assert.ok(html.includes('Magic'));
    assert.ok(html.includes('Strength'));
    assert.ok(html.includes('+2'));
  });

  it('formatSlotType maps equipment slots', () => {
    assert.equal(formatSlotType('helm'), 'Helm');
    assert.equal(formatSlotType('weapon'), 'Weapon');
  });

  it('getStatCompareLines includes deltas against equipped item', () => {
    const lines = getStatCompareLines(
      { stats: { str: 5, dex: 2 } },
      { stats: { str: 3, vit: 1 } }
    );

    assert.deepEqual(lines, [
      { key: 'str', label: 'Strength', value: 5, delta: 2 },
      { key: 'dex', label: 'Dexterity', value: 2, delta: 2 },
      { key: 'vit', label: 'Vitality', value: 0, delta: -1 },
    ]);
  });

  it('buildItemInspectHtml shows compare header when equipped item provided', () => {
    const html = buildItemInspectHtml(
      { name: 'New Sword', rarity: 'rare', slot: 'weapon', stats: { str: 5 } },
      { compareWith: { name: 'Old Sword', stats: { str: 3 } }, compareHeader: 'vs Old Sword' }
    );

    assert.ok(html.includes('vs Old Sword'));
    assert.ok(html.includes('item-stat-delta--up'));
    assert.ok(html.includes('(+2)'));
  });
});
