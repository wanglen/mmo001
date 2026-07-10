import { MAP_ID, WORLD_MAP_IDS } from '../worldMaps.js';
import { REGULAR_MONSTER_TYPES } from '../monsters.js';
import { LOOT_TEMPLATES, POTION_TEMPLATES } from '../items.js';

/** NPCs that can give or turn in quests. */
export const QUEST_NPC_IDS = ['innkeeper-mira', 'guide-eldon'];

/** Zones allowed on kill objectives (town is never a kill zone). */
export const QUEST_OBJECTIVE_MAP_IDS = WORLD_MAP_IDS.filter((id) => id !== MAP_ID.TOWN);

/** Fetch objective item keys (potions only for generated/fetch content). */
export const QUEST_FETCH_ITEM_KEYS = POTION_TEMPLATES.map((t) => t.key);

/** Reward template keys (gear + potions). */
export const QUEST_REWARD_TEMPLATE_KEYS = [
  ...POTION_TEMPLATES.map((t) => t.key),
  ...LOOT_TEMPLATES.map((t) => t.key),
];

export const QUEST_OBJECTIVE_TYPES = ['kill', 'fetch', 'talk'];

/**
 * Compact catalog for LLM prompts and validation.
 * @returns {{
 *   npcIds: string[],
 *   monsterTypes: string[],
 *   mapIds: string[],
 *   itemKeys: string[],
 *   rewardTemplateKeys: string[],
 *   objectiveTypes: string[]
 * }}
 */
export function getQuestCatalog() {
  return {
    npcIds: [...QUEST_NPC_IDS],
    monsterTypes: [...REGULAR_MONSTER_TYPES],
    mapIds: [...QUEST_OBJECTIVE_MAP_IDS],
    itemKeys: [...QUEST_FETCH_ITEM_KEYS],
    rewardTemplateKeys: [...QUEST_REWARD_TEMPLATE_KEYS],
    objectiveTypes: [...QUEST_OBJECTIVE_TYPES],
  };
}

/** @param {string} npcId */
export function isQuestNpcId(npcId) {
  return QUEST_NPC_IDS.includes(npcId);
}
