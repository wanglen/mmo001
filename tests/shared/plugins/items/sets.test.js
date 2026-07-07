import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getSetBonuses, getSetForTemplate } from '../../../../shared/plugins/items/sets.js';

describe('item sets', () => {
  it('getSetForTemplate maps known gear to a set id', () => {
    assert.equal(getSetForTemplate('leather_boots'), 'nomad_trail');
  });

  it('getSetBonuses applies highest tier reached', () => {
    const equipment = {
      boots: { setId: 'nomad_trail', templateKey: 'leather_boots' },
      gloves: { setId: 'nomad_trail', templateKey: 'leather_gloves' },
      helm: { setId: 'nomad_trail', templateKey: 'leather_cap' },
    };
    const bonuses = getSetBonuses(equipment);
    assert.equal(bonuses.dex, 4);
    assert.equal(bonuses.damagePercent, 8);
  });
});
