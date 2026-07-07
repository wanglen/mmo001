import { grantXp } from '../../../shared/stats.js';
import {
  acceptQuest,
  canAcceptQuest,
  consumeFetchObjectives,
  getQuestDef,
  isQuestReady,
  normalizeQuestState,
  recordQuestKill,
  recordQuestTalk,
} from '../../../shared/quests.js';
import { addItemToInventory } from '../../../shared/inventory.js';
import {
  createItem,
  createPotion,
  LOOT_TEMPLATES,
  POTION_TEMPLATES,
  RARITY,
} from '../../../shared/items.js';
import { findNpcAt, NPC_INTERACT_RANGE } from '../../../shared/npcs.js';

function ensureQuestState(player) {
  player.questState = normalizeQuestState(player.questState);
  player.gold = player.gold ?? 0;
  return player.questState;
}

function findTemplate(templateKey) {
  return (
    LOOT_TEMPLATES.find((entry) => entry.key === templateKey) ??
    POTION_TEMPLATES.find((entry) => entry.key === templateKey) ??
    null
  );
}

function createRewardItem(spec) {
  const template = findTemplate(spec.templateKey);
  if (!template) return null;
  const rarity = spec.rarity ?? RARITY.COMMON;
  if (template.consumableKind) return createPotion(template, rarity);
  return createItem(template, rarity);
}

export function onMonsterKillQuests(player, monsterType) {
  const state = ensureQuestState(player);
  recordQuestKill(state, monsterType);
}

export function interactWithNpc(player, npcs, npcId) {
  const npc = npcs.find((entry) => entry.id === npcId);
  if (!npc) return { ok: false, reason: 'invalid_npc' };
  const nearby = findNpcAt(npcs, player.x, player.y, NPC_INTERACT_RANGE);
  if (!nearby || nearby.id !== npcId) {
    return { ok: false, reason: 'out_of_range' };
  }

  const state = ensureQuestState(player);
  recordQuestTalk(state, npcId);
  return { ok: true, npcId };
}

export function acceptQuestForPlayer(player, questId, npcId) {
  const quest = getQuestDef(questId);
  if (!quest || quest.giverNpcId !== npcId) {
    return { ok: false, reason: 'invalid_quest' };
  }

  const state = ensureQuestState(player);
  if (!canAcceptQuest(state, questId)) {
    return { ok: false, reason: 'cannot_accept' };
  }

  return acceptQuest(state, questId);
}

export function turnInQuestForPlayer(player, questId, npcId) {
  const quest = getQuestDef(questId);
  if (!quest || quest.turnInNpcId !== npcId) {
    return { ok: false, reason: 'invalid_quest' };
  }

  const state = ensureQuestState(player);
  if (!state.active[questId]) {
    return { ok: false, reason: 'not_active' };
  }
  if (!isQuestReady(quest, state, player.inventory)) {
    return { ok: false, reason: 'not_ready' };
  }
  if (!consumeFetchObjectives(quest, player.inventory)) {
    return { ok: false, reason: 'missing_items' };
  }

  delete state.active[questId];
  state.completed.push(questId);

  const rewards = quest.rewards ?? {};
  let xpResult = null;
  if (rewards.xp > 0) {
    xpResult = grantXp(player, rewards.xp, player.characterClass);
  }
  if (rewards.gold > 0) {
    player.gold += rewards.gold;
  }

  const grantedItems = [];
  for (const spec of rewards.items ?? []) {
    const item = createRewardItem(spec);
    if (!item) continue;
    const result = addItemToInventory(player.inventory, item);
    if (result.ok) grantedItems.push(item);
  }

  return { ok: true, questId, xp: xpResult, gold: rewards.gold ?? 0, items: grantedItems };
}
