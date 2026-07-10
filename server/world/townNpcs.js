import { createNpc, NPC_ROLE } from '../../shared/npcs.js';
import { QUESTS } from '../../shared/quests.js';
import { VENDOR_ID } from '../../shared/vendors.js';
import { TILE_WALKABLE } from '../../shared/constants.js';

function questIdsForNpc(npcId) {
  return Object.values(QUESTS)
    .filter((quest) => quest.giverNpcId === npcId || quest.turnInNpcId === npcId)
    .map((quest) => quest.id);
}

/** Keep NPC tiles off rock borders and on walkable ground. */
export function clampNpcTile(map, tile) {
  const margin = 2;
  let x = Math.max(margin, Math.min(map.width - 1 - margin, tile.x));
  let y = Math.max(margin, Math.min(map.height - 1 - margin, tile.y));

  if (map.tiles?.[y]?.[x] != null && !TILE_WALKABLE[map.tiles[y][x]]) {
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0]]) {
      const nx = Math.max(margin, Math.min(map.width - 1 - margin, x + dx));
      const ny = Math.max(margin, Math.min(map.height - 1 - margin, y + dy));
      if (TILE_WALKABLE[map.tiles[ny][nx]]) {
        return { x: nx, y: ny };
      }
    }
  }

  return { x, y };
}

export function buildTownNpcs(town) {
  const { spawn } = town;

  const specs = [
    {
      id: 'innkeeper-mira',
      name: 'Mira',
      role: NPC_ROLE.INNKEEPER,
      tile: { x: spawn.x - 2, y: spawn.y },
      questIds: questIdsForNpc('innkeeper-mira'),
      dialogue: [
        'Welcome to Haven, traveler.',
        'Your health and mana recover fully while you stay in town.',
        'Press T to begin a six-second recall cast back to town.',
      ],
    },
    {
      id: 'guide-eldon',
      name: 'Eldon',
      role: NPC_ROLE.GUIDE,
      tile: { x: spawn.x + 2, y: spawn.y + 1 },
      questIds: questIdsForNpc('guide-eldon'),
      dialogue: [
        'The wilderness lies beyond the southern gate.',
        'Dark Forest and Scorched Desert portals lie northwest and northeast in the wilderness.',
        'Monsters grow bolder in the dungeon — venture there only when ready.',
      ],
    },
    {
      id: VENDOR_ID.TOWN_MERCHANT,
      name: 'Brok',
      role: NPC_ROLE.VENDOR,
      vendorId: VENDOR_ID.TOWN_MERCHANT,
      tile: { x: spawn.x + 1, y: spawn.y - 2 },
      dialogue: ['Need supplies? I buy and sell adventurer gear.'],
    },
  ];

  return specs.map((spec) =>
    createNpc({
      ...spec,
      tile: clampNpcTile(town, spec.tile),
    })
  );
}
