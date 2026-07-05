import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isTownHubMap,
  TOWN_RECALL_CAST_MS,
  townRecallProgress,
} from '../../shared/townHub.js';
import { MAP_ID } from '../../shared/worldMaps.js';

describe('townHub', () => {
  it('isTownHubMap matches town map id', () => {
    assert.equal(isTownHubMap({ mapId: MAP_ID.TOWN }), true);
    assert.equal(isTownHubMap({ mapId: MAP_ID.WILDERNESS }), false);
    assert.equal(isTownHubMap(null), false);
  });

  it('townRecallProgress clamps 0–1', () => {
    assert.equal(townRecallProgress(0), 0);
    assert.equal(townRecallProgress(TOWN_RECALL_CAST_MS / 2), 0.5);
    assert.equal(townRecallProgress(TOWN_RECALL_CAST_MS), 1);
    assert.equal(townRecallProgress(TOWN_RECALL_CAST_MS * 2), 1);
  });
});
