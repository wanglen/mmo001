import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveItemIconKey,
  inferTemplateKeyFromName,
  stripRarityPrefix,
} from '../../shared/itemIcons.js';

describe('itemIcons', () => {
  it('resolveItemIconKey uses templateKey when present', () => {
    assert.equal(resolveItemIconKey({ templateKey: 'short_bow', slot: 'weapon' }), 'short_bow');
  });

  it('resolveItemIconKey maps consumable kinds', () => {
    assert.equal(resolveItemIconKey({ consumableKind: 'health', type: 'consumable' }), 'health_potion');
    assert.equal(resolveItemIconKey({ consumableKind: 'mana', type: 'consumable' }), 'mana_potion');
  });

  it('resolveItemIconKey infers from legacy item names', () => {
    assert.equal(resolveItemIconKey({ name: 'Magic Rusty Sword', slot: 'weapon' }), 'rusty_sword');
    assert.equal(resolveItemIconKey({ name: 'Health Potion', type: 'consumable', consumableKind: 'health' }), 'health_potion');
  });

  it('resolveItemIconKey falls back to slot or fallbackSlot', () => {
    assert.equal(resolveItemIconKey({ slot: 'ring', name: 'Unknown' }), 'ring');
    assert.equal(resolveItemIconKey(null, 'boots'), 'boots');
    assert.equal(resolveItemIconKey(null), 'chest');
  });

  it('stripRarityPrefix removes tier prefixes', () => {
    assert.equal(stripRarityPrefix('Rare Leather Vest'), 'Leather Vest');
    assert.equal(stripRarityPrefix('Rusty Sword'), 'Rusty Sword');
  });

  it('inferTemplateKeyFromName matches templates', () => {
    assert.equal(inferTemplateKeyFromName('Jade Amulet'), 'jade_amulet');
    assert.equal(inferTemplateKeyFromName('Unique Mana Potion'), 'mana_potion');
    assert.equal(inferTemplateKeyFromName('Unknown Item'), null);
  });
});
