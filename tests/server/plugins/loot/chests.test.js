import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TILE } from '../../../../shared/constants.js';
import { MAP_ID } from '../../../../shared/worldMaps.js';
import { openDungeonChest } from '../../../../server/plugins/loot/chests.js';
import { createEmptyInventory } from '../../../../shared/inventory.js';

describe('openDungeonChest', () => {
  const map = {
    mapId: MAP_ID.DUNGEON,
    width: 8,
    height: 8,
    tiles: Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => 0)),
  };
  map.tiles[3][4] = TILE.CHEST;

  it('grants loot when in range and marks chest opened', () => {
    const player = {
      x: 4 * 32,
      y: 3 * 32,
      gold: 0,
      inventory: createEmptyInventory(),
      openedChests: {},
    };

    const result = openDungeonChest({
      player,
      map,
      tileX: 4,
      tileY: 3,
      random: () => 0.99,
    });

    assert.equal(result.ok, true);
    assert.ok(result.gold > 0 || result.item);
    assert.ok(player.openedChests[MAP_ID.DUNGEON]?.includes('4,3'));
  });

  it('rejects already opened chests', () => {
    const player = {
      x: 4 * 32,
      y: 3 * 32,
      gold: 0,
      inventory: createEmptyInventory(),
      openedChests: { [MAP_ID.DUNGEON]: ['4,3'] },
    };

    const result = openDungeonChest({ player, map, tileX: 4, tileY: 3 });
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'already_opened');
  });
});
