import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RARITY } from '../../../../shared/items.js';
import {
  rollAffixes,
  buildAffixedName,
  affixesToStats,
  AFFIX_KIND,
} from '../../../../shared/plugins/items/affixes.js';

describe('affixes', () => {
  it('rollAffixes returns empty for common gear', () => {
    assert.deepEqual(rollAffixes(RARITY.COMMON, () => 0), []);
  });

  it('rollAffixes rolls multiple affixes on rare items', () => {
    const affixes = rollAffixes(RARITY.RARE, () => 0);
    assert.ok(affixes.length >= 3);
    assert.ok(affixes.every((affix) => affix.label && affix.value > 0));
  });

  it('buildAffixedName composes prefix and suffix', () => {
    const name = buildAffixedName('Leather Cap', [
      { kind: AFFIX_KIND.PREFIX, label: 'Mighty' },
      { kind: AFFIX_KIND.SUFFIX, label: 'of the Bear' },
    ]);
    assert.equal(name, 'Mighty Leather Cap of the Bear');
  });

  it('affixesToStats sums stat values', () => {
    const stats = affixesToStats([
      { stat: 'str', value: 3 },
      { stat: 'damagePercent', value: 10 },
    ]);
    assert.equal(stats.str, 3);
    assert.equal(stats.damagePercent, 10);
  });
});
