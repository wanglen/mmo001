import questsData from './content/quests.json' with { type: 'json' };
import { MAP_LABELS } from './worldMaps.js';

export const QUEST_OBJECTIVE = {
  KILL: 'kill',
  FETCH: 'fetch',
  TALK: 'talk',
};

/** @typedef {{ type: string, monsterType?: string, count?: number, itemKey?: string, npcId?: string, requiredMapId?: string }} QuestObjective */
/** @typedef {{ xp?: number, gold?: number, items?: { templateKey: string, rarity?: string }[] }} QuestRewards */
/** @typedef {{ id: string, title: string, giverNpcId: string, turnInNpcId: string, prerequisites?: string[], objectives: QuestObjective[], rewards?: QuestRewards, dialogue: object }} QuestDef */
/** @typedef {{ active: Record<string, { progress: object }>, completed: string[], defs: Record<string, QuestDef>, lastGenAt?: number, recentTitles?: string[], recentFingerprints?: string[] }} QuestState */

export const QUESTS = questsData;

export function createEmptyQuestState() {
  return { active: {}, completed: [], defs: {}, recentTitles: [], recentFingerprints: [] };
}

/**
 * @param {unknown} state
 * @returns {QuestState}
 */
export function normalizeQuestState(state) {
  if (!state || typeof state !== 'object') return createEmptyQuestState();
  const defs =
    state.defs && typeof state.defs === 'object'
      ? Object.fromEntries(
          Object.entries(state.defs).filter(([, def]) => def && typeof def === 'object')
        )
      : {};
  return {
    active: state.active && typeof state.active === 'object' ? { ...state.active } : {},
    completed: Array.isArray(state.completed) ? [...state.completed] : [],
    defs,
    lastGenAt: typeof state.lastGenAt === 'number' ? state.lastGenAt : undefined,
    recentTitles: Array.isArray(state.recentTitles)
      ? state.recentTitles.filter((t) => typeof t === 'string').slice(-12)
      : [],
    recentFingerprints: Array.isArray(state.recentFingerprints)
      ? state.recentFingerprints.filter((t) => typeof t === 'string').slice(-12)
      : [],
  };
}

/**
 * Resolve a quest definition from static content or per-player generated defs.
 * @param {string} questId
 * @param {QuestState | null | undefined} [state]
 */
export function getQuestDef(questId, state = null) {
  return QUESTS[questId] ?? state?.defs?.[questId] ?? null;
}

/**
 * @param {string} npcId
 * @param {QuestState | null | undefined} [state]
 */
export function questsForNpc(npcId, state = null) {
  const staticQuests = Object.values(QUESTS).filter(
    (quest) => quest.giverNpcId === npcId || quest.turnInNpcId === npcId
  );
  if (!state?.defs) return staticQuests;

  const seen = new Set(staticQuests.map((q) => q.id));
  const generated = Object.values(state.defs).filter((quest) => {
    if (!quest || seen.has(quest.id)) return false;
    return quest.giverNpcId === npcId || quest.turnInNpcId === npcId;
  });
  return [...staticQuests, ...generated];
}

export function hasCompletedQuest(state, questId) {
  return state.completed.includes(questId);
}

export function isQuestActive(state, questId) {
  return !!state.active[questId];
}

export function prerequisitesMet(state, quest) {
  return (quest.prerequisites ?? []).every((id) => hasCompletedQuest(state, id));
}

export function canAcceptQuest(state, questId) {
  const quest = getQuestDef(questId, state);
  if (!quest) return false;
  if (hasCompletedQuest(state, questId) || isQuestActive(state, questId)) return false;
  return prerequisitesMet(state, quest);
}

export function acceptQuest(state, questId) {
  if (!canAcceptQuest(state, questId)) {
    return { ok: false, reason: 'cannot_accept' };
  }
  state.active[questId] = { progress: {} };
  return { ok: true, questId };
}

export function countItemsByTemplate(inventory, templateKey) {
  if (!inventory?.length) return 0;
  return inventory.filter((item) => item?.templateKey === templateKey).length;
}

function killProgress(entry, monsterType) {
  return entry?.progress?.kill?.[monsterType] ?? 0;
}

function talkProgress(entry, npcId) {
  return !!entry?.progress?.talk?.[npcId];
}

/** Kill credit only when objective has no map filter or player is on that map. */
export function killObjectiveMatchesMap(objective, mapId) {
  if (!objective?.requiredMapId) return true;
  return objective.requiredMapId === mapId;
}

export function isObjectiveMet(objective, entry, inventory) {
  if (objective.type === QUEST_OBJECTIVE.KILL) {
    return killProgress(entry, objective.monsterType) >= (objective.count ?? 1);
  }
  if (objective.type === QUEST_OBJECTIVE.FETCH) {
    return countItemsByTemplate(inventory, objective.itemKey) >= (objective.count ?? 1);
  }
  if (objective.type === QUEST_OBJECTIVE.TALK) {
    return talkProgress(entry, objective.npcId);
  }
  return false;
}

export function isQuestReady(quest, state, inventory) {
  const entry = state.active[quest.id];
  if (!entry) return false;
  return quest.objectives.every((objective) => isObjectiveMet(objective, entry, inventory));
}

export function recordQuestKill(state, monsterType, mapId) {
  for (const questId of Object.keys(state.active)) {
    const quest = getQuestDef(questId, state);
    if (!quest) continue;

    const entry = state.active[questId];
    for (const objective of quest.objectives) {
      if (objective.type !== QUEST_OBJECTIVE.KILL || objective.monsterType !== monsterType) continue;
      if (!killObjectiveMatchesMap(objective, mapId)) continue;
      entry.progress.kill = entry.progress.kill ?? {};
      const current = entry.progress.kill[monsterType] ?? 0;
      entry.progress.kill[monsterType] = Math.min(objective.count ?? 1, current + 1);
    }
  }
}

export function recordQuestTalk(state, npcId) {
  for (const questId of Object.keys(state.active)) {
    const quest = getQuestDef(questId, state);
    if (!quest) continue;

    const entry = state.active[questId];
    for (const objective of quest.objectives) {
      if (objective.type !== QUEST_OBJECTIVE.TALK || objective.npcId !== npcId) continue;
      entry.progress.talk = entry.progress.talk ?? {};
      entry.progress.talk[npcId] = true;
    }
  }
}

export function removeItemsByTemplate(inventory, templateKey, count) {
  let removed = 0;
  for (let i = 0; i < inventory.length && removed < count; i++) {
    if (inventory[i]?.templateKey === templateKey) {
      inventory[i] = null;
      removed += 1;
    }
  }
  return removed === count;
}

export function consumeFetchObjectives(quest, inventory) {
  for (const objective of quest.objectives) {
    if (objective.type !== QUEST_OBJECTIVE.FETCH) continue;
    const needed = objective.count ?? 1;
    if (!removeItemsByTemplate(inventory, objective.itemKey, needed)) {
      return false;
    }
  }
  return true;
}

/**
 * Generated quest ids that are offered but not yet accepted or completed.
 * @param {QuestState} state
 * @returns {string[]}
 */
export function getPendingOfferIds(state) {
  if (!state?.defs) return [];
  return Object.keys(state.defs).filter(
    (id) => !state.active[id] && !state.completed.includes(id)
  );
}

/** Count active quests that came from generated defs. */
export function countActiveGeneratedQuests(state) {
  if (!state?.defs) return 0;
  return Object.keys(state.active).filter((id) => !!state.defs[id]).length;
}

/**
 * Remove pending (unaccepted) generated offers from defs.
 * @param {QuestState} state
 */
export function clearPendingOffers(state) {
  for (const id of getPendingOfferIds(state)) {
    delete state.defs[id];
  }
}

/**
 * @param {'available'|'active'|'ready'|'completed'|'unavailable'} status
 */
export function questDialogueLines(quest, status, npcId = null) {
  if (status === 'active' && npcId && quest.dialogue.atTarget) {
    const talkHere = quest.objectives?.some(
      (objective) =>
        objective.type === QUEST_OBJECTIVE.TALK && objective.npcId === npcId
    );
    if (talkHere) return quest.dialogue.atTarget;
  }
  if (status === 'available') return quest.dialogue.offer;
  if (status === 'active') return quest.dialogue.progress;
  if (status === 'ready') return quest.dialogue.ready;
  if (status === 'completed') return quest.dialogue.complete;
  return quest.dialogue.offer;
}

export function questStatusForNpc(state, inventory, quest, npcId) {
  if (hasCompletedQuest(state, quest.id)) return 'completed';
  if (isQuestActive(state, quest.id)) {
    const atTurnIn = quest.turnInNpcId === npcId;
    if (atTurnIn && isQuestReady(quest, state, inventory)) return 'ready';
    return 'active';
  }
  if (quest.giverNpcId === npcId && canAcceptQuest(state, quest.id)) return 'available';
  return 'unavailable';
}

/** Ordered quest interactions for an NPC click. */
export function getNpcQuestInteractions(state, inventory, npcId) {
  const interactions = [];

  for (const quest of questsForNpc(npcId, state)) {
    const status = questStatusForNpc(state, inventory, quest, npcId);
    if (status === 'unavailable') continue;

    interactions.push({
      questId: quest.id,
      title: quest.title,
      status,
      lines: questDialogueLines(quest, status, npcId),
      canAccept: status === 'available' && quest.giverNpcId === npcId,
      canTurnIn: status === 'ready' && quest.turnInNpcId === npcId,
      progressText: formatQuestProgress(quest, state, inventory),
      rewards: quest.rewards,
    });
  }

  const priority = { ready: 0, available: 1, active: 2, completed: 3 };
  interactions.sort((a, b) => (priority[a.status] ?? 9) - (priority[b.status] ?? 9));
  return interactions;
}

export function formatQuestProgress(quest, state, inventory) {
  const entry = state.active[quest.id];
  if (!entry) return '';

  return quest.objectives
    .map((objective) => {
      if (objective.type === QUEST_OBJECTIVE.KILL) {
        const current = killProgress(entry, objective.monsterType);
        const zone =
          objective.requiredMapId != null
            ? ` in ${MAP_LABELS[objective.requiredMapId] ?? objective.requiredMapId}`
            : '';
        return `Kill ${objective.monsterType}${zone}: ${current}/${objective.count}`;
      }
      if (objective.type === QUEST_OBJECTIVE.FETCH) {
        const current = countItemsByTemplate(inventory, objective.itemKey);
        return `Collect ${objective.itemKey}: ${current}/${objective.count}`;
      }
      if (objective.type === QUEST_OBJECTIVE.TALK) {
        return talkProgress(entry, objective.npcId) ? 'Spoke to contact' : 'Speak to contact';
      }
      return '';
    })
    .filter(Boolean)
    .join(' · ');
}

export function getActiveQuestSummaries(state, inventory) {
  return Object.keys(state.active)
    .map((questId) => {
      const quest = getQuestDef(questId, state);
      if (!quest) return null;
      return {
        id: quest.id,
        title: quest.title,
        ready: isQuestReady(quest, state, inventory),
        progressText: formatQuestProgress(quest, state, inventory),
      };
    })
    .filter(Boolean);
}

/**
 * Client/sync payload: active progress, completed ids, and defs needed for UI
 * (active generated + pending offers).
 * @param {QuestState} state
 */
export function questStateToJSON(state) {
  const normalized = normalizeQuestState(state);
  const defs = {};
  for (const id of Object.keys(normalized.active)) {
    if (normalized.defs[id]) defs[id] = normalized.defs[id];
  }
  for (const id of getPendingOfferIds(normalized)) {
    defs[id] = normalized.defs[id];
  }
  return {
    active: Object.fromEntries(
      Object.entries(normalized.active).map(([questId, entry]) => [
        questId,
        { progress: entry.progress ?? {} },
      ])
    ),
    completed: [...normalized.completed],
    defs,
    lastGenAt: normalized.lastGenAt,
    recentTitles: [...(normalized.recentTitles ?? [])],
    recentFingerprints: [...(normalized.recentFingerprints ?? [])],
  };
}
