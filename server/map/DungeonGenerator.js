import { TILE } from '../../shared/constants.js';
import { createDungeonZone } from '../../shared/zones.js';
import { createBossRoomZone } from '../../shared/dungeon.js';

const MIN_ROOM_COUNT = 6;
const MAX_ROOM_COUNT = 10;
const ROOM_PADDING = 2;
const CORRIDOR_WIDTH = 2;
const MAX_PLACEMENT_ATTEMPTS = 120;
const MAX_LOOP_CORRIDORS = 2;

function randomInt(min, max, random = Math.random) {
  return min + Math.floor(random() * (max - min + 1));
}

/** @param {{ x: number, y: number, w: number, h: number }} a @param {{ x: number, y: number, w: number, h: number }} b */
export function roomsOverlap(a, b, padding = ROOM_PADDING) {
  return !(
    a.x + a.w + padding <= b.x ||
    b.x + b.w + padding <= a.x ||
    a.y + a.h + padding <= b.y ||
    b.y + b.h + padding <= a.y
  );
}

function manhattan(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
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

/** L-shaped corridor between two tile points. */
export function carveCorridor(tiles, from, to, random = Math.random) {
  if (randomInt(0, 1, random) === 0) {
    carveHorizontal(tiles, from.y, from.x, to.x);
    carveVertical(tiles, to.x, from.y, to.y);
  } else {
    carveVertical(tiles, from.x, from.y, to.y);
    carveHorizontal(tiles, to.y, from.x, to.x);
  }
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

function targetRoomCount(width, height) {
  const area = width * height;
  if (area < 1800) return MIN_ROOM_COUNT;
  return Math.min(MAX_ROOM_COUNT, MIN_ROOM_COUNT + Math.floor(area / 2500));
}

/**
 * Scatter non-overlapping rooms across the map bounds.
 * @param {number} width
 * @param {number} height
 * @param {number} targetCount
 * @param {() => number} random
 */
export function placeScatteredRooms(width, height, targetCount, random = Math.random) {
  const margin = 3;
  const maxW = Math.min(14, width - margin * 2 - 2);
  const maxH = Math.min(12, height - margin * 2 - 2);
  const rooms = [];
  let attempts = 0;
  const attemptLimit = targetCount * MAX_PLACEMENT_ATTEMPTS;

  while (rooms.length < targetCount && attempts < attemptLimit) {
    attempts += 1;
    const rw = randomInt(5, maxW, random);
    const rh = randomInt(4, maxH, random);
    const rx = randomInt(margin, width - rw - margin - 1, random);
    const ry = randomInt(margin, height - rh - margin - 1, random);
    const candidate = {
      x: rx,
      y: ry,
      w: rw,
      h: rh,
      center: { x: rx + Math.floor(rw / 2), y: ry + Math.floor(rh / 2) },
    };

    if (rooms.some((room) => roomsOverlap(room, candidate))) continue;
    rooms.push(candidate);
  }

  return rooms;
}

/**
 * Prim's MST on room centers — guarantees full connectivity with branching.
 * @param {Array<{ center: { x: number, y: number } }>} rooms
 */
export function buildRoomCorridorEdges(rooms) {
  if (rooms.length <= 1) return [];

  const edges = [];
  const inTree = new Set([0]);

  while (inTree.size < rooms.length) {
    let best = null;

    for (const i of inTree) {
      for (let j = 0; j < rooms.length; j++) {
        if (inTree.has(j)) continue;
        const dist = manhattan(rooms[i].center, rooms[j].center);
        if (!best || dist < best.dist) {
          best = { from: i, to: j, dist };
        }
      }
    }

    if (!best) break;
    edges.push({ from: best.from, to: best.to });
    inTree.add(best.to);
  }

  return edges;
}

function edgeKey(a, b) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

/** Add a few extra corridors for optional loops (Diablo-style backtracking). */
export function addLoopCorridors(edges, rooms, random = Math.random, maxExtra = MAX_LOOP_CORRIDORS) {
  const connected = new Set(edges.map(({ from, to }) => edgeKey(from, to)));
  const candidates = [];

  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const key = edgeKey(i, j);
      if (!connected.has(key)) {
        candidates.push({
          from: i,
          to: j,
          dist: manhattan(rooms[i].center, rooms[j].center),
        });
      }
    }
  }

  candidates.sort((a, b) => a.dist - b.dist);
  const extras = [];

  for (const candidate of candidates) {
    if (extras.length >= maxExtra) break;
    if (random() > 0.55) continue;
    extras.push({ from: candidate.from, to: candidate.to });
    connected.add(edgeKey(candidate.from, candidate.to));
  }

  return [...edges, ...extras];
}

/** Entry near top-left; boss in the room farthest from entry. */
export function pickEntryAndBossRooms(rooms) {
  if (!rooms.length) {
    return { entryIdx: 0, bossIdx: 0 };
  }

  let entryIdx = 0;
  let entryScore = Infinity;

  for (let i = 0; i < rooms.length; i++) {
    const score = rooms[i].center.x + rooms[i].center.y;
    if (score < entryScore) {
      entryScore = score;
      entryIdx = i;
    }
  }

  const entryCenter = rooms[entryIdx].center;
  let bossIdx = entryIdx;
  let bossDist = -1;

  for (let i = 0; i < rooms.length; i++) {
    const dist = manhattan(rooms[i].center, entryCenter);
    if (dist > bossDist) {
      bossDist = dist;
      bossIdx = i;
    }
  }

  return { entryIdx, bossIdx };
}

/**
 * Procedural Diablo-style dungeon: scattered rooms, MST corridors, optional loops, boss chamber.
 * @param {number} width
 * @param {number} height
 * @param {{ random?: () => number }} [options]
 */
export function generateDungeonLayout(width, height, options = {}) {
  const random = options.random ?? Math.random;
  const targetCount = targetRoomCount(width, height);
  let rooms = placeScatteredRooms(width, height, targetCount, random);

  if (rooms.length < 4) {
    rooms = placeScatteredRooms(width, height, Math.max(4, targetCount - 2), random);
  }

  const tiles = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => TILE.ROCK)
  );
  placeRockBorder(tiles, width, height);

  for (const room of rooms) {
    carveRect(tiles, room.x, room.y, room.w, room.h);
  }

  let edges = buildRoomCorridorEdges(rooms);
  edges = addLoopCorridors(edges, rooms, random);

  for (const { from, to } of edges) {
    carveCorridor(tiles, rooms[from].center, rooms[to].center, random);
  }

  const { entryIdx, bossIdx } = pickEntryAndBossRooms(rooms);
  const entry = rooms[entryIdx];
  const bossRoom = rooms[bossIdx];

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

  return { tiles, width, height, spawn, zones, rooms, corridors: edges };
}
