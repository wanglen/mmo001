import { TILE_SIZE } from './constants.js';

export const NPC_HIT_RADIUS = 22;

export const NPC_ROLE = {
  INNKEEPER: 'innkeeper',
  GUIDE: 'guide',
};

/**
 * @param {{ id: string, name: string, role: string, tile: { x: number, y: number }, dialogue?: string[] }} spec
 */
export function createNpc(spec) {
  return {
    id: spec.id,
    name: spec.name,
    role: spec.role,
    x: spec.tile.x * TILE_SIZE + TILE_SIZE / 2,
    y: spec.tile.y * TILE_SIZE + TILE_SIZE / 2,
    tile: spec.tile,
    dialogue: spec.dialogue ?? [],
  };
}

export function npcToJSON(npc) {
  return {
    id: npc.id,
    name: npc.name,
    role: npc.role,
    x: npc.x,
    y: npc.y,
    dialogue: npc.dialogue,
  };
}

export function findNpcAt(npcs, x, y, radius = NPC_HIT_RADIUS) {
  if (!npcs?.length) return null;
  let nearest = null;
  let nearestDist = radius;
  for (const npc of npcs) {
    const dist = Math.hypot(npc.x - x, npc.y - y);
    if (dist <= nearestDist) {
      nearest = npc;
      nearestDist = dist;
    }
  }
  return nearest;
}
