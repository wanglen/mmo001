import { TILE } from '../../shared/constants.js';
import { createDungeonZone } from '../../shared/zones.js';
import { createBossRoomZone } from '../../shared/dungeon.js';

const MIN_ROOM_COUNT = 5;
const MAX_ROOM_COUNT = 7;
const CORRIDOR_WIDTH = 2;

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function carveRect(tiles, x, y, w, h, tile = TILE.GRASS) {
  const height = tiles.length;
  const width = tiles[0].length;

  for (let row = y; row < y + h; row++) {
    for (let col = x; col < x + w; col++) {
      if (row <= 0 || col <= 0 || row >= height - 1 || col >= width - 1) continue;
      tiles[row][col] = tile;
    }
  }
}

function carveHorizontal(tiles, y, x1, x2) {
  const left = Math.min(x1, x2);
  const right = Math.max(x1, x2);
  for (let x = left; x <= right; x++) {
    for (let dy = 0; dy < CORRIDOR_WIDTH; dy++) {
      const row = y + dy;
      if (row <= 0 || row >= tiles.length - 1) continue;
      if (x <= 0 || x >= tiles[0].length - 1) continue;
      tiles[row][x] = TILE.GRASS;
    }
  }
}

function carveVertical(tiles, x, y1, y2) {
  const top = Math.min(y1, y2);
  const bottom = Math.max(y1, y2);
  for (let y = top; y <= bottom; y++) {
    for (let dx = 0; dx < CORRIDOR_WIDTH; dx++) {
      const col = x + dx;
      if (y <= 0 || y >= tiles.length - 1) continue;
      if (col <= 0 || col >= tiles[0].length - 1) continue;
      tiles[y][col] = TILE.GRASS;
    }
  }
}

function connectRooms(tiles, from, to) {
  carveHorizontal(tiles, from.y, from.x, to.x);
  carveVertical(tiles, to.x, from.y, to.y);
}

function placeRockBorder(tiles, width, height) {
  for (let x = 0; x < width; x++) {
    tiles[0][x] = TILE.ROCK;
    tiles[height - 1][x] = TILE.ROCK;
  }
  for (let y = 0; y < height; y++) {
    tiles[y][0] = TILE.ROCK;
    tiles[y][width - 1] = TILE.ROCK;
  }
}

function generateRooms(width, height) {
  const roomCount = randomInt(MIN_ROOM_COUNT, MAX_ROOM_COUNT);
  const margin = 4;
  const verticalSpan = height - margin * 2;
  const slotHeight = Math.floor(verticalSpan / roomCount);
  const rooms = [];

  for (let i = 0; i < roomCount; i++) {
    const rw = randomInt(6, Math.min(11, width - margin * 2));
    const rh = randomInt(5, Math.min(9, slotHeight - 2));
    const rx = randomInt(margin, width - rw - margin);
    const ry = randomInt(
      margin + i * slotHeight,
      Math.min(height - rh - margin, margin + i * slotHeight + Math.max(1, slotHeight - rh - 1))
    );
    const center = { x: rx + Math.floor(rw / 2), y: ry + Math.floor(rh / 2) };
    rooms.push({ x: rx, y: ry, w: rw, h: rh, center });
  }

  return rooms;
}

/**
 * Procedural dungeon: rock-filled map with carved rooms, corridors, and a boss chamber.
 * @param {number} width
 * @param {number} height
 */
export function generateDungeonLayout(width, height) {
  const tiles = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => TILE.ROCK)
  );
  placeRockBorder(tiles, width, height);

  const rooms = generateRooms(width, height);
  for (const room of rooms) {
    carveRect(tiles, room.x, room.y, room.w, room.h);
  }

  for (let i = 1; i < rooms.length; i++) {
    connectRooms(tiles, rooms[i - 1].center, rooms[i].center);
  }

  const entry = rooms[0];
  const bossRoom = rooms[rooms.length - 1];
  const spawn = {
    x: entry.center.x,
    y: Math.min(entry.y + entry.h - 2, entry.center.y + 1),
  };
  tiles[spawn.y][spawn.x] = TILE.GRASS;

  const dungeonCenter = { x: Math.floor(width / 2), y: Math.floor(height / 2) };
  const dungeonRadius = Math.floor(Math.min(width, height) / 2) - 2;
  const bossRadius = Math.max(3, Math.floor(Math.max(bossRoom.w, bossRoom.h) / 2));

  const zones = [
    createBossRoomZone(bossRoom.center, bossRadius),
    createDungeonZone(dungeonCenter, dungeonRadius),
  ];

  return { tiles, width, height, spawn, zones };
}
