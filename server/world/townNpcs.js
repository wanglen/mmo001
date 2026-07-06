import { createNpc, NPC_ROLE } from '../../shared/npcs.js';
import { QUESTS } from '../../shared/quests.js';

function questIdsForNpc(npcId) {
  return Object.values(QUESTS)
    .filter((quest) => quest.giverNpcId === npcId || quest.turnInNpcId === npcId)
    .map((quest) => quest.id);
}

export function buildTownNpcs(town) {
  const { spawn } = town;

  return [
    createNpc({
      id: 'innkeeper-mira',
      name: 'Mira',
      role: NPC_ROLE.INNKEEPER,
      tile: { x: spawn.x - 2, y: spawn.y - 1 },
      questIds: questIdsForNpc('innkeeper-mira'),
      dialogue: [
        'Welcome to Haven, traveler.',
        'Your health and mana recover fully while you stay in town.',
        'Press T to begin a six-second recall cast back to town.',
      ],
    }),
    createNpc({
      id: 'guide-eldon',
      name: 'Eldon',
      role: NPC_ROLE.GUIDE,
      tile: { x: spawn.x + 2, y: spawn.y + 1 },
      questIds: questIdsForNpc('guide-eldon'),
      dialogue: [
        'The wilderness lies beyond the southern gate.',
        'Monsters grow bolder in the dungeon — venture there only when ready.',
      ],
    }),
  ];
}
