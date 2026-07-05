import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SPAWN_COUNT } from '../../shared/monsters.js';
import { MAP_WIDTH, MAP_HEIGHT } from '../../shared/constants.js';

describe('monsters spawn count', () => {
  it('SPAWN_COUNT scales with map area vs original 12 on 40×30', () => {
    const expected = Math.round((12 * MAP_WIDTH * MAP_HEIGHT) / (40 * 30));
    assert.equal(SPAWN_COUNT, expected);
    assert.equal(SPAWN_COUNT, 108);
  });
});
