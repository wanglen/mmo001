import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ZONE_ID,
  TOWN_RADIUS_TILES,
  createTownZone,
  isInSafeZone,
  isTileInZone,
  isTileInAnySafeZone,
  townRadiusTiles,
} from '../../shared/zones.js';
import { TILE_SIZE } from '../../shared/constants.js';

describe('zones', () => {
  it('createTownZone uses town id and fixed radius', () => {
    const zone = createTownZone({ x: 10, y: 20 }, 120);
    assert.equal(zone.id, ZONE_ID.TOWN);
    assert.equal(zone.label, 'Town');
    assert.ok(zone.safe);
    assert.deepEqual(zone.center, { x: 10, y: 20 });
    assert.equal(zone.radius, TOWN_RADIUS_TILES);
    assert.equal(townRadiusTiles(120), TOWN_RADIUS_TILES);
  });

  it('isTileInZone uses Chebyshev distance from center', () => {
    const zone = { center: { x: 5, y: 5 }, radius: 2, safe: true, id: ZONE_ID.TOWN };
    assert.ok(isTileInZone(zone, 5, 5));
    assert.ok(isTileInZone(zone, 7, 5));
    assert.ok(!isTileInZone(zone, 8, 5));
    assert.ok(isTileInZone(zone, 7, 7));
    assert.ok(!isTileInZone(zone, 8, 8));
  });

  it('isInSafeZone checks pixel position against map zones', () => {
    const map = {
      zones: [createTownZone({ x: 2, y: 2 }, 40)],
    };
    const inside = 2 * TILE_SIZE + TILE_SIZE / 2;
    const outside = 10 * TILE_SIZE + TILE_SIZE / 2;
    assert.ok(isInSafeZone(map, inside, inside));
    assert.ok(!isInSafeZone(map, outside, outside));
    assert.ok(isTileInAnySafeZone(map, 2, 2));
    assert.ok(!isTileInAnySafeZone(map, 20, 20));
  });
});
