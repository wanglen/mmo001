import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TILE } from '../../shared/constants.js';
import {
  isRoomPerimeter,
  isRoomInterior,
  shouldPlaceDoor,
  placeRoomWallsAndDoors,
  placeRoomChests,
  placeDungeonLandmarks,
} from '../../shared/landmarks.js';

function rockGrid(width, height) {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => TILE.ROCK));
}

function carveRoom(tiles, room) {
  for (let row = room.y; row < room.y + room.h; row++) {
    for (let col = room.x; col < room.x + room.w; col++) {
      tiles[row][col] = TILE.GRASS;
    }
  }
}

describe('landmarks', () => {
  const room = { x: 5, y: 5, w: 7, h: 5 };

  it('isRoomPerimeter detects room border tiles', () => {
    assert.ok(isRoomPerimeter(room, 5, 5));
    assert.ok(isRoomPerimeter(room, 11, 9));
    assert.ok(!isRoomPerimeter(room, 8, 7));
  });

  it('isRoomInterior detects floor tiles inside walls', () => {
    assert.ok(isRoomInterior(room, 8, 7));
    assert.ok(!isRoomInterior(room, 5, 5));
  });

  it('shouldPlaceDoor is true when corridor grass touches the perimeter', () => {
    const tiles = rockGrid(20, 20);
    carveRoom(tiles, room);
    tiles[4][8] = TILE.GRASS;

    assert.ok(shouldPlaceDoor(tiles, room, 8, 5));
    assert.ok(!shouldPlaceDoor(tiles, room, 5, 5));
  });

  it('placeRoomWallsAndDoors rings rooms with walls and corridor-facing doors', () => {
    const tiles = rockGrid(20, 20);
    carveRoom(tiles, room);
    tiles[4][8] = TILE.GRASS;

    placeRoomWallsAndDoors(tiles, [room]);

    assert.equal(tiles[5][8], TILE.DOOR);
    assert.equal(tiles[5][6], TILE.WALL);
    assert.equal(tiles[7][8], TILE.GRASS);
  });

  it('placeRoomChests places a chest in every side room', () => {
    const tiles = rockGrid(30, 30);
    const rooms = [
      { x: 2, y: 2, w: 6, h: 5 },
      { x: 12, y: 2, w: 6, h: 5 },
      { x: 22, y: 2, w: 6, h: 5 },
      { x: 12, y: 12, w: 6, h: 5 },
    ];
    for (const carved of rooms) carveRoom(tiles, carved);

    placeRoomChests(tiles, rooms, 0, 2);

    let chestCount = 0;
    for (const row of tiles) {
      for (const tile of row) {
        if (tile === TILE.CHEST) chestCount++;
      }
    }
    assert.equal(chestCount, 2, 'entry and boss skipped; two side rooms get chests');
  });

  it('placeRoomChests skips entry and boss rooms', () => {
    const tiles = rockGrid(30, 30);
    const rooms = [
      { x: 2, y: 2, w: 6, h: 5 },
      { x: 12, y: 2, w: 6, h: 5 },
      { x: 22, y: 2, w: 6, h: 5 },
    ];
    for (const carved of rooms) carveRoom(tiles, carved);

    placeRoomChests(tiles, rooms, 0, 2, () => 0.1);

    let chestCount = 0;
    for (const row of tiles) {
      for (const tile of row) {
        if (tile === TILE.CHEST) chestCount++;
      }
    }
    assert.equal(chestCount, 1);
    assert.equal(tiles[4][4], TILE.GRASS, 'entry room should not get a chest');
    assert.equal(tiles[4][24], TILE.GRASS, 'boss room should not get a chest');

    const middleRoom = rooms[1];
    let chestInMiddle = false;
    for (let row = middleRoom.y + 1; row < middleRoom.y + middleRoom.h - 1; row++) {
      for (let col = middleRoom.x + 1; col < middleRoom.x + middleRoom.w - 1; col++) {
        if (tiles[row][col] === TILE.CHEST) chestInMiddle = true;
      }
    }
    assert.ok(chestInMiddle, 'middle room should get a chest');
  });

  it('placeDungeonLandmarks applies walls, doors, and chests together', () => {
    const tiles = rockGrid(40, 30);
    const rooms = [
      { x: 5, y: 5, w: 8, h: 6 },
      { x: 18, y: 8, w: 7, h: 5 },
      { x: 28, y: 12, w: 6, h: 5 },
    ];
    for (const carved of rooms) carveRoom(tiles, carved);
    tiles[4][10] = TILE.GRASS;

    placeDungeonLandmarks(tiles, rooms, { entryIdx: 0, bossIdx: 2, random: () => 0.1 });

    assert.ok(tiles.some((row) => row.includes(TILE.WALL)));
    assert.ok(tiles.some((row) => row.includes(TILE.DOOR)));
    assert.ok(tiles.some((row) => row.includes(TILE.CHEST)));
  });
});
