import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from '../../../server/world/World.js';
import { MAP_ID } from '../../../shared/worldMaps.js';
import { findPath } from '../../../shared/pathfinding.js';
import { pickTownWildernessGate } from '../../../server/world/portalPlacement.js';
import { generateMap } from '../../../server/map/MapGenerator.js';

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
});
