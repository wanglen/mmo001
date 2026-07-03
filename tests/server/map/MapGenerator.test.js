import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateMap } from '../../../server/map/MapGenerator.js';
import { isWalkable } from '../../../server/map/collision.js';
import { TILE_WALKABLE, MAP_WIDTH, MAP_HEIGHT } from '../../../shared/constants.js';

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
    assert.ok(connected >= 400, `expected >= 400 walkable tiles, got ${connected}`);
  });

  it('returns spawn coordinates within map bounds', () => {
    const map = generateMap();
    assert.ok(map.spawn.x >= 0 && map.spawn.x < map.width);
    assert.ok(map.spawn.y >= 0 && map.spawn.y < map.height);
  });
});
