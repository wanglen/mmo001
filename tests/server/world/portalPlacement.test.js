import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from '../../../server/world/World.js';
import { MAP_ID, WORLD_MAP_SIZES } from '../../../shared/worldMaps.js';
import { findPath } from '../../../shared/pathfinding.js';
import { pickTownWildernessGate } from '../../../server/world/portalPlacement.js';
import { generateMap } from '../../../server/map/MapGenerator.js';
import { isTileInZone, wildernessDungeonRadiusTiles } from '../../../shared/zones.js';

describe('portalPlacement', () => {
  it('pickTownWildernessGate connects spawn to a walkable portal tile', () => {
    for (let attempt = 0; attempt < 8; attempt++) {
      const map = generateMap(48, 36, { zoneLayout: 'town-only' });
      const gate = pickTownWildernessGate(map);
      const path = findPath(map, map.spawn.x, map.spawn.y, gate.x, gate.y);
      assert.ok(path.length > 0, `expected path to gate on attempt ${attempt}`);
    }
  });

  it('town wilderness portal is reachable in the live world', () => {
    const world = createWorld();
    const town = world.getMap(MAP_ID.TOWN);
    const portal = town.portals[0];
    const path = findPath(town, town.spawn.x, town.spawn.y, portal.tile.x, portal.tile.y);
    assert.ok(path.length > 0);
  });

  it('wilderness map includes a large dungeon gate zone and reachable portal', () => {
    const world = createWorld();
    const wilderness = world.getMap(MAP_ID.WILDERNESS);
    const { width, height } = WORLD_MAP_SIZES[MAP_ID.WILDERNESS];
    const expectedRadius = wildernessDungeonRadiusTiles(width, height);
    const dungeonZone = wilderness.zones?.find((zone) => zone.id === 'dungeon');
    assert.ok(dungeonZone);
    assert.equal(dungeonZone.radius, expectedRadius);
    assert.ok(wilderness.dungeonGateTile);
    assert.deepEqual(dungeonZone.gateTile, wilderness.dungeonGateTile);
    assert.ok(
      isTileInZone(dungeonZone, wilderness.dungeonGateTile.x, wilderness.dungeonGateTile.y),
      'gate tile should sit on the dungeon zone edge'
    );

    const dungeonPortal = wilderness.portals.find((portal) => portal.id === 'wilderness-dungeon');
    assert.ok(dungeonPortal);
    assert.equal(dungeonPortal.tile.x, wilderness.dungeonGateTile.x);
    assert.equal(dungeonPortal.tile.y, wilderness.dungeonGateTile.y);

    const path = findPath(
      wilderness,
      wilderness.spawn.x,
      wilderness.spawn.y,
      wilderness.dungeonGateTile.x,
      wilderness.dungeonGateTile.y
    );
    assert.ok(path.length > 0);
  });
});
