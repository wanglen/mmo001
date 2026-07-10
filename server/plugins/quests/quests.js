import { grantXp } from '../../../shared/stats.js';
import {
  acceptQuest,
  canAcceptQuest,
  clearPendingOffers,
  consumeFetchObjectives,
  countActiveGeneratedQuests,
  getQuestDef,
  isQuestReady,
  normalizeQuestState,
  recordQuestKill,
  recordQuestTalk,
} from '../../../shared/quests.js';
import { isQuestNpcId } from '../../../shared/content/questCatalog.js';
import { addItemToInventory } from '../../../shared/inventory.js';
import {
  createItem,
  createPotion,
  LOOT_TEMPLATES,
  POTION_TEMPLATES,
  RARITY,
} from '../../../shared/items.js';
import { findNpcAt, NPC_INTERACT_RANGE } from '../../../shared/npcs.js';
import {
  OLLAMA_ENABLED,
  OLLAMA_MODEL,
  OLLAMA_TIMEOUT_MS,
  OLLAMA_URL,
  QUEST_GEN_COOLDOWN_MS,
  QUEST_GEN_MAX_ACTIVE,
} from '../../config.js';
import {
  generateQuestFromOllama,
  questObjectiveFingerprint,
} from '../../llm/questGenerator.js';
import { logQuestGeneration } from '../../debug/questGenLog.js';
import { logGameEvent } from '../../debug/eventLog.js';

function ensureQuestState(player) {
  player.questState = normalizeQuestState(player.questState);
  player.gold = player.gold ?? 0;
  return player.questState;
}

/**
 * @param {object} player
 * @param {string} npcId
 * @param {{ ok: boolean, reason?: string, message?: string, quest?: object }} result
 * @param {number} startedAt
 */
function recordQuestGenerationLog(player, npcId, result, startedAt) {
  const durationMs = Math.max(0, Date.now() - startedAt);
  const quest = result.quest ?? null;
  const fingerprint = quest ? questObjectiveFingerprint(quest) : null;
  const payload = {
    ok: !!result.ok,
    reason: result.reason ?? null,
    message: result.message ?? null,
    playerId: player.id,
    playerName: player.name,
    level: player.level ?? 1,
    mapId: player.mapId,
    npcId,
    durationMs,
    model: OLLAMA_MODEL,
    questId: quest?.id ?? null,
    title: quest?.title ?? null,
    fingerprint,
    objectiveType: quest?.objectives?.[0]?.type ?? null,
  };

  logQuestGeneration(payload);
  logGameEvent('quest_generate', payload, { source: 'server' });
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
  recordQuestKill(state, monsterType, player.mapId);
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
  const state = ensureQuestState(player);
  const quest = getQuestDef(questId, state);
  if (!quest || quest.giverNpcId !== npcId) {
    return { ok: false, reason: 'invalid_quest' };
  }

  if (!canAcceptQuest(state, questId)) {
    return { ok: false, reason: 'cannot_accept' };
  }

  return acceptQuest(state, questId);
}

export function turnInQuestForPlayer(player, questId, npcId) {
  const state = ensureQuestState(player);
  const quest = getQuestDef(questId, state);
  if (!quest || quest.turnInNpcId !== npcId) {
    return { ok: false, reason: 'invalid_quest' };
  }

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

/**
 * Generate a per-player quest via local Ollama and store it as a pending offer.
 * @param {object} player
 * @param {object[]} npcs
 * @param {string} npcId
 * @param {{ generate?: typeof generateQuestFromOllama }} [deps]
 */
export async function generateQuestForPlayer(player, npcs, npcId, deps = {}) {
  const startedAt = Date.now();

  const finish = (result) => {
    recordQuestGenerationLog(player, npcId, result, startedAt);
    return result;
  };

  if (!OLLAMA_ENABLED) {
    return finish({ ok: false, reason: 'disabled', message: 'Quest generation is disabled' });
  }
  if (typeof npcId !== 'string' || !isQuestNpcId(npcId)) {
    return finish({
      ok: false,
      reason: 'invalid_npc',
      message: 'This NPC cannot offer generated quests',
    });
  }

  const npc = npcs.find((entry) => entry.id === npcId);
  if (!npc) {
    return finish({ ok: false, reason: 'invalid_npc', message: 'Unknown NPC' });
  }
  const nearby = findNpcAt(npcs, player.x, player.y, NPC_INTERACT_RANGE);
  if (!nearby || nearby.id !== npcId) {
    return finish({ ok: false, reason: 'out_of_range', message: 'Too far from NPC' });
  }

  const state = ensureQuestState(player);
  const now = Date.now();
  if (state.lastGenAt && now - state.lastGenAt < QUEST_GEN_COOLDOWN_MS) {
    const waitSec = Math.ceil((QUEST_GEN_COOLDOWN_MS - (now - state.lastGenAt)) / 1000);
    return finish({
      ok: false,
      reason: 'cooldown',
      message: `Wait ${waitSec}s before requesting another task`,
    });
  }

  if (countActiveGeneratedQuests(state) >= QUEST_GEN_MAX_ACTIVE) {
    return finish({
      ok: false,
      reason: 'max_active',
      message: `Complete a generated quest first (max ${QUEST_GEN_MAX_ACTIVE} active)`,
    });
  }

  const recentGeneratedTitles = [
    ...(state.recentTitles ?? []),
    ...Object.values(state.defs)
      .map((def) => def?.title)
      .filter(Boolean),
  ].slice(-12);

  const recentFingerprints = [
    ...(state.recentFingerprints ?? []),
    ...Object.values(state.defs)
      .map((def) => (def ? questObjectiveFingerprint(def) : null))
      .filter(Boolean),
  ].slice(-12);

  const generate = deps.generate ?? generateQuestFromOllama;
  const result = await generate({
    baseUrl: OLLAMA_URL,
    model: OLLAMA_MODEL,
    timeoutMs: OLLAMA_TIMEOUT_MS,
    giverNpcId: npcId,
    level: player.level ?? 1,
    mapId: player.mapId,
    activeQuestIds: Object.keys(state.active),
    completedQuestIds: state.completed,
    recentGeneratedTitles,
    recentFingerprints,
  });

  if (!result.ok) {
    return finish({
      ok: false,
      reason: result.reason ?? 'generation_failed',
      message: result.message ?? 'Quest generation failed',
    });
  }

  clearPendingOffers(state);
  state.defs[result.quest.id] = result.quest;
  state.lastGenAt = now;
  state.recentTitles = [...recentGeneratedTitles, result.quest.title].slice(-12);
  state.recentFingerprints = [
    ...recentFingerprints,
    questObjectiveFingerprint(result.quest),
  ].slice(-12);

  return finish({ ok: true, quest: result.quest });
}
