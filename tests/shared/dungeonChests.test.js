import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TILE } from '../../shared/constants.js';
import {
  chestTileKey,
  findChestAt,
  hasOpenedChest,
  markChestOpened,
  normalizeOpenedChests,
} from '../../shared/dungeonChests.js';
import { MAP_ID } from '../../shared/worldMaps.js';

describe('dungeonChests', () => {
  const map = {
    mapId: MAP_ID.DUNGEON,
    width: 10,
    height: 10,
    tiles: Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => 0)),
  };

  map.tiles[4][5] = TILE.CHEST;

  it('findChestAt locates unopened chest tiles', () => {
    const chest = findChestAt(map, 5 * 32 + 16, 4 * 32 + 16, []);
    assert.ok(chest);
    assert.equal(chest.key, chestTileKey(5, 4));
  });

  it('findChestAt ignores opened chest keys', () => {
    const chest = findChestAt(map, 5 * 32 + 16, 4 * 32 + 16, [chestTileKey(5, 4)]);
    assert.equal(chest, null);
  });

  it('tracks opened chests per map on the player', () => {
    const player = { openedChests: {} };
    markChestOpened(player, MAP_ID.DUNGEON, '5,4');
    assert.ok(hasOpenedChest(player, MAP_ID.DUNGEON, '5,4'));
    assert.equal(normalizeOpenedChests({ [MAP_ID.DUNGEON]: ['5,4'] })[MAP_ID.DUNGEON].length, 1);
  });
});
