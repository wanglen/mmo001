import { TILE } from './constants.js';

/** @param {{ x: number, y: number, w: number, h: number }} room */
export function isRoomPerimeter(room, col, row) {
  if (row < room.y || row >= room.y + room.h || col < room.x || col >= room.x + room.w) {
    return false;
  }
  return (
    row === room.y ||
    row === room.y + room.h - 1 ||
    col === room.x ||
    col === room.x + room.w - 1
  );
}

/** @param {{ x: number, y: number, w: number, h: number }} room */
export function isRoomInterior(room, col, row) {
  return (
    col > room.x &&
    col < room.x + room.w - 1 &&
    row > room.y &&
    row < room.y + room.h - 1
  );
}

function neighbors4(col, row) {
  return [
    { x: col, y: row - 1 },
    { x: col, y: row + 1 },
    { x: col - 1, y: row },
    { x: col + 1, y: row },
  ];
}

function isInsideRoomBounds(room, col, row) {
  return col >= room.x && col < room.x + room.w && row >= room.y && row < room.y + room.h;
}

/**
 * Perimeter tile opens when walkable floor exists outside the room (corridor approach).
 * @param {number[][]} tiles
 * @param {{ x: number, y: number, w: number, h: number }} room
 */
export function shouldPlaceDoor(tiles, room, col, row) {
  for (const { x, y } of neighbors4(col, row)) {
    if (isInsideRoomBounds(room, x, y)) continue;
    if (tiles[y]?.[x] === TILE.GRASS || tiles[y]?.[x] === TILE.DOOR) return true;
  }
  return false;
}

/**
 * Ring each carved room with impassable walls and walkable doorways.
 * @param {number[][]} tiles
 * @param {Array<{ x: number, y: number, w: number, h: number }>} rooms
 */
export function placeRoomWallsAndDoors(tiles, rooms) {
  for (const room of rooms) {
    for (let row = room.y; row < room.y + room.h; row++) {
      for (let col = room.x; col < room.x + room.w; col++) {
        if (!isRoomPerimeter(room, col, row)) continue;
        if (tiles[row][col] !== TILE.GRASS) continue;

        tiles[row][col] = shouldPlaceDoor(tiles, room, col, row) ? TILE.DOOR : TILE.WALL;
      }
    }
  }
}

/**
 * Scatter openable chests in non-entry, non-boss rooms.
 * @param {number[][]} tiles
 * @param {Array<{ x: number, y: number, w: number, h: number }>} rooms
 * @param {number} entryIdx
 * @param {number} bossIdx
 * @param {() => number} random
 */
export function placeRoomChests(tiles, rooms, entryIdx, bossIdx, random = Math.random) {
  for (let i = 0; i < rooms.length; i++) {
    if (i === entryIdx || i === bossIdx) continue;

    const room = rooms[i];
    const candidates = [];

    for (let row = room.y + 1; row < room.y + room.h - 1; row++) {
      for (let col = room.x + 1; col < room.x + room.w - 1; col++) {
        if (tiles[row][col] === TILE.GRASS) {
          candidates.push({ x: col, y: row });
        }
      }
    }

    if (!candidates.length) continue;
    const pick = candidates[Math.floor(random() * candidates.length)];
    tiles[pick.y][pick.x] = TILE.CHEST;
  }
}

/**
 * @param {number[][]} tiles
 * @param {Array<{ x: number, y: number, w: number, h: number }>} rooms
 * @param {{ entryIdx?: number, bossIdx?: number, random?: () => number }} [options]
 */
export function placeDungeonLandmarks(tiles, rooms, options = {}) {
  const entryIdx = options.entryIdx ?? 0;
  const bossIdx = options.bossIdx ?? 0;
  const random = options.random ?? Math.random;

  placeRoomWallsAndDoors(tiles, rooms);
  placeRoomChests(tiles, rooms, entryIdx, bossIdx, random);
}
