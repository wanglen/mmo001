import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  filterByInterestRadius,
  INTEREST_RADIUS_PX,
  isWithinInterestRadius,
} from '../../../../shared/plugins/world/interest.js';

describe('interest', () => {
  it('isWithinInterestRadius uses circular range', () => {
    assert.equal(isWithinInterestRadius(0, 0, { x: 100, y: 0 }, 120), true);
    assert.equal(isWithinInterestRadius(0, 0, { x: 200, y: 0 }, 120), false);
  });

  it('filterByInterestRadius keeps nearby entities', () => {
    const entities = [
      { id: 'near', x: 50, y: 0 },
      { id: 'far', x: 5000, y: 0 },
    ];
    const hits = filterByInterestRadius(0, 0, entities, INTEREST_RADIUS_PX);
    assert.deepEqual(hits.map((entry) => entry.id), ['near']);
  });
});
