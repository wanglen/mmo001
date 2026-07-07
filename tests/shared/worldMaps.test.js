import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MAP_ID, getMapDisplayName, MAP_LABELS } from '../../shared/worldMaps.js';

describe('worldMaps', () => {
  it('getMapDisplayName returns labels for known maps', () => {
    assert.equal(getMapDisplayName(MAP_ID.TOWN), MAP_LABELS[MAP_ID.TOWN]);
    assert.equal(getMapDisplayName(MAP_ID.WILDERNESS), 'Wilderness');
    assert.equal(getMapDisplayName(MAP_ID.DUNGEON), 'Dungeon');
  });

  it('getMapDisplayName falls back for unknown ids', () => {
    assert.equal(getMapDisplayName('unknown'), 'Unknown Area');
    assert.equal(getMapDisplayName(null), 'Unknown Area');
  });
});
