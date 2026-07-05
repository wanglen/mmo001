import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getItemStatLines,
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
});
