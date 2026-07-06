import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ZONE_ID,
  TOWN_RADIUS_TILES,
  createTownZone,
  createDungeonZone,
  getZoneAt,
  getZoneAtPixel,
  dungeonSpawnBonus,
  totalSpawnTarget,
  isInSafeZone,
  isTileInZone,
  isTileInAnySafeZone,
  isTileInZoneId,
  wildernessDungeonRadiusTiles,
  pickDungeonGateTile,
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

  it('getZoneAt defaults to wilderness outside marked regions', () => {
    const map = {
      zones: [createTownZone({ x: 5, y: 5 }, 40)],
    };
    assert.equal(getZoneAt(map, 5, 5).id, ZONE_ID.TOWN);
    assert.equal(getZoneAt(map, 20, 20).id, ZONE_ID.WILDERNESS);
    assert.equal(getZoneAt(map, 20, 20).label, 'Wilderness');
  });

  it('getZoneAt resolves dungeon and spawn bonus helpers', () => {
    const map = {
      zones: [createDungeonZone({ x: 30, y: 30 }, 5)],
    };
    assert.equal(getZoneAt(map, 30, 30).id, ZONE_ID.DUNGEON);
    assert.ok(isTileInZoneId(map, ZONE_ID.DUNGEON, 30, 30));
    assert.equal(dungeonSpawnBonus(100), 35);
    assert.equal(totalSpawnTarget(100), 135);
    const px = 30 * TILE_SIZE + TILE_SIZE / 2;
    assert.equal(getZoneAtPixel(map, px, px).id, ZONE_ID.DUNGEON);
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

  it('isInSafeZone treats entire town hub map as safe', () => {
    const map = { mapId: 'town', width: 48, height: 36, zones: [] };
    assert.ok(isInSafeZone(map, 999, 999));
  });

  it('wildernessDungeonRadiusTiles scales with map size', () => {
    assert.equal(wildernessDungeonRadiusTiles(120, 90), 12);
    assert.ok(wildernessDungeonRadiusTiles(48, 36) >= 12);
  });

  it('pickDungeonGateTile places gate on zone edge facing spawn', () => {
    const center = { x: 80, y: 60 };
    const gate = pickDungeonGateTile(center, 12, { x: 20, y: 20 });
    assert.ok(isTileInZone({ center, radius: 12 }, gate.x, gate.y));
    assert.ok(gate.x === center.x - 12 || gate.y === center.y - 12);
  });
});
