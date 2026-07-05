import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateMap, minConnectedTiles } from '../../../server/map/MapGenerator.js';
import { isWalkable } from '../../../server/map/collision.js';
import { TILE_WALKABLE, TILE, MAP_WIDTH, MAP_HEIGHT } from '../../../shared/constants.js';
import { ZONE_ID, TOWN_RADIUS_TILES } from '../../../shared/zones.js';

function countWalkableFromSpawn(map) {
  const visited = new Set();
  const queue = [map.spawn];
  visited.add(`${map.spawn.x},${map.spawn.y}`);

  while (queue.length > 0) {
    const { x, y } = queue.shift();
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;
      if (visited.has(key)) continue;
      if (!isWalkable(map, nx, ny)) continue;
      visited.add(key);
      queue.push({ x: nx, y: ny });
    }
  }

  return visited.size;
}

describe('MapGenerator', () => {
  it('generates map with expected dimensions', () => {
    const map = generateMap();
    assert.equal(map.width, MAP_WIDTH);
    assert.equal(map.height, MAP_HEIGHT);
    assert.equal(map.tiles.length, MAP_HEIGHT);
    assert.equal(map.tiles[0].length, MAP_WIDTH);
  });

  it('places spawn on a walkable tile', () => {
    const map = generateMap();
    assert.ok(isWalkable(map, map.spawn.x, map.spawn.y));
  });

  it('provides a large connected walkable region from spawn', () => {
    const map = generateMap();
    const connected = countWalkableFromSpawn(map);
    const minConnected = minConnectedTiles(map.width, map.height);
    assert.ok(connected >= minConnected, `expected >= ${minConnected} walkable tiles, got ${connected}`);
  });

  it('returns spawn coordinates within map bounds', () => {
    const map = generateMap();
    assert.ok(map.spawn.x >= 0 && map.spawn.x < map.width);
    assert.ok(map.spawn.y >= 0 && map.spawn.y < map.height);
  });

  it('includes town zone with identifier', () => {
    const map = generateMap();
    assert.ok(Array.isArray(map.zones));
    assert.equal(map.zones.length, 1);
    assert.equal(map.zones[0].id, ZONE_ID.TOWN);
    assert.equal(map.zones[0].label, 'Town');
    assert.ok(map.zones[0].safe);
    assert.equal(map.zones[0].radius, TOWN_RADIUS_TILES);
  });

  it('rings the map edge with impassable rock tiles', () => {
    const map = generateMap();
    const { width, height, tiles } = map;

    for (let x = 0; x < width; x++) {
      assert.equal(tiles[0][x], TILE.ROCK);
      assert.equal(tiles[height - 1][x], TILE.ROCK);
    }
    for (let y = 0; y < height; y++) {
      assert.equal(tiles[y][0], TILE.ROCK);
      assert.equal(tiles[y][width - 1], TILE.ROCK);
    }

    assert.ok(!isWalkable(map, 0, 0));
    assert.ok(!isWalkable(map, width - 1, height - 1));
    assert.ok(isWalkable(map, map.spawn.x, map.spawn.y));
  });
});
