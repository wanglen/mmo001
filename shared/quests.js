export const QUEST_OBJECTIVE = {
  KILL: 'kill',
  FETCH: 'fetch',
  TALK: 'talk',
};

/** @typedef {{ type: string, monsterType?: string, count?: number, itemKey?: string, npcId?: string }} QuestObjective */
/** @typedef {{ xp?: number, gold?: number, items?: { templateKey: string, rarity?: string }[] }} QuestRewards */

export const QUESTS = {
  'goblin-menace': {
    id: 'goblin-menace',
    title: 'Goblin Menace',
    giverNpcId: 'guide-eldon',
    turnInNpcId: 'guide-eldon',
    prerequisites: [],
    objectives: [{ type: QUEST_OBJECTIVE.KILL, monsterType: 'goblin', count: 3 }],
    rewards: { xp: 40, gold: 25 },
    dialogue: {
      offer: [
        'Goblins lurk beyond the southern gate.',
        'Slay three of them, then return to me.',
      ],
      progress: ['The wilderness still has goblins to cull.'],
      ready: ['You have thinned the goblin pack. Claim your reward.'],
      complete: ['Haven is safer thanks to you.'],
    },
  },
  'healing-supplies': {
    id: 'healing-supplies',
    title: 'Healing Supplies',
    giverNpcId: 'innkeeper-mira',
    turnInNpcId: 'innkeeper-mira',
    prerequisites: ['goblin-menace'],
    objectives: [{ type: QUEST_OBJECTIVE.FETCH, itemKey: 'health_potion', count: 1 }],
    rewards: { xp: 30, gold: 40, items: [{ templateKey: 'mana_potion', rarity: 'common' }] },
    dialogue: {
      offer: [
        'Travelers keep arriving wounded.',
        'Bring me a health potion for the stockroom.',
      ],
      progress: ['I still need a health potion. Check loot from monsters or your bag.'],
      ready: ['Perfect — that potion will help. Take your payment.'],
      complete: ['Stay rested while you are in town.'],
    },
  },
  'report-to-eldon': {
    id: 'report-to-eldon',
    title: 'Report to Eldon',
    giverNpcId: 'innkeeper-mira',
    turnInNpcId: 'guide-eldon',
    prerequisites: ['healing-supplies'],
    objectives: [{ type: QUEST_OBJECTIVE.TALK, npcId: 'guide-eldon' }],
    rewards: { xp: 20, gold: 15 },
    dialogue: {
      offer: [
        'Eldon should hear that our supplies are replenished.',
        'Speak with him at the square.',
      ],
      progress: ['Find Eldon in town and let him know.'],
      atTarget: ['Ah, Mira sent word about the supplies?', 'Tell me what happened.'],
      ready: ['Eldon knows the news. Here is a little something for the errand.'],
      complete: ['The town council appreciates reliable couriers.'],
    },
  },
};

export function createEmptyQuestState() {
  return { active: {}, completed: [] };
}

export function normalizeQuestState(state) {
  if (!state || typeof state !== 'object') return createEmptyQuestState();
  return {
    active: state.active && typeof state.active === 'object' ? { ...state.active } : {},
    completed: Array.isArray(state.completed) ? [...state.completed] : [],
  };
}

export function getQuestDef(questId) {
  return QUESTS[questId] ?? null;
}

export function questsForNpc(npcId) {
  return Object.values(QUESTS).filter(
    (quest) => quest.giverNpcId === npcId || quest.turnInNpcId === npcId
  );
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
  const quest = getQuestDef(questId);
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

export function recordQuestKill(state, monsterType) {
  for (const questId of Object.keys(state.active)) {
    const quest = getQuestDef(questId);
    if (!quest) continue;

    const entry = state.active[questId];
    for (const objective of quest.objectives) {
      if (objective.type !== QUEST_OBJECTIVE.KILL || objective.monsterType !== monsterType) continue;
      entry.progress.kill = entry.progress.kill ?? {};
      const current = entry.progress.kill[monsterType] ?? 0;
      entry.progress.kill[monsterType] = Math.min(objective.count ?? 1, current + 1);
    }
  }
}

export function recordQuestTalk(state, npcId) {
  for (const questId of Object.keys(state.active)) {
    const quest = getQuestDef(questId);
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

  for (const quest of questsForNpc(npcId)) {
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
        return `Kill ${objective.monsterType}: ${current}/${objective.count}`;
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
      const quest = getQuestDef(questId);
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

export function questStateToJSON(state) {
  return {
    active: Object.fromEntries(
      Object.entries(state.active).map(([questId, entry]) => [questId, { progress: entry.progress ?? {} }])
    ),
    completed: [...state.completed],
  };
}
