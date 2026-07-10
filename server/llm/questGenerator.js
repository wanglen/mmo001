import { randomBytes, randomInt } from 'node:crypto';
import { getQuestCatalog } from '../../shared/content/questCatalog.js';
import { validateQuestDef } from '../../shared/content/validateContent.js';
import { ollamaChat } from './ollamaClient.js';

const MIN_COUNT = 1;
const MAX_COUNT = 8;

/**
 * @param {number} level
 * @returns {{ xp: number, gold: number }}
 */
export function clampRewardBudget(level) {
  const lvl = Math.max(1, Math.floor(Number(level) || 1));
  return {
    xp: Math.min(40 + lvl * 12, 200),
    gold: Math.min(20 + lvl * 8, 150),
  };
}

/**
 * Stable objective signature used to detect near-duplicate generated quests.
 * @param {{ objectives?: object[] } | null | undefined} quest
 * @returns {string}
 */
export function questObjectiveFingerprint(quest) {
  const objective = quest?.objectives?.[0];
  if (!objective || typeof objective !== 'object') return 'empty';
  if (objective.type === 'kill') {
    return `kill:${objective.monsterType ?? ''}:${objective.requiredMapId ?? ''}`;
  }
  if (objective.type === 'fetch') {
    return `fetch:${objective.itemKey ?? ''}`;
  }
  if (objective.type === 'talk') {
    return `talk:${objective.npcId ?? ''}`;
  }
  return `other:${objective.type ?? ''}`;
}

/**
 * @param {string} title
 * @returns {string}
 */
export function normalizeQuestTitle(title) {
  return String(title ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Player-facing title derived from the objective (no random suffixes).
 * @param {{ type?: string, monsterType?: string, itemKey?: string, npcId?: string } | null | undefined} objective
 * @returns {string}
 */
export function titleFromObjective(objective) {
  if (!objective || typeof objective !== 'object') return 'A New Task';
  if (objective.type === 'kill') {
    const name = String(objective.monsterType ?? 'foe').replace(/_/g, ' ');
    const label = name.charAt(0).toUpperCase() + name.slice(1);
    return `${label} Hunt`;
  }
  if (objective.type === 'fetch') {
    const name = String(objective.itemKey ?? 'supplies').replace(/_/g, ' ');
    return `Gather ${name}`;
  }
  if (objective.type === 'talk') {
    return 'Deliver a Message';
  }
  return 'A New Task';
}

/**
 * @param {object} quest
 * @param {{ titles?: string[], fingerprints?: string[] }} avoid
 */
export function isDuplicateGeneratedQuest(quest, avoid = {}) {
  const fingerprint = questObjectiveFingerprint(quest);
  const fingerprints = avoid.fingerprints ?? [];
  if (fingerprint && fingerprints.includes(fingerprint)) return true;

  const title = normalizeQuestTitle(quest?.title);
  if (!title) return false;
  const titles = (avoid.titles ?? []).map(normalizeQuestTitle).filter(Boolean);
  return titles.includes(title);
}

/**
 * Strip markdown fences and parse JSON object from model output.
 * @param {string} text
 * @returns {object}
 */
export function parseQuestJson(text) {
  let raw = String(text ?? '').trim();
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) raw = fence[1].trim();

  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON object in model response');
  }
  return JSON.parse(raw.slice(start, end + 1));
}

/**
 * @returns {string}
 */
export function allocateGeneratedQuestId() {
  return `gen-${randomBytes(4).toString('hex')}`;
}

/**
 * @param {string[]} list
 * @param {string[]} [avoid]
 */
function pickRandom(list, avoid = []) {
  const preferred = list.filter((entry) => !avoid.includes(entry));
  const pool = preferred.length ? preferred : list;
  return pool[randomInt(pool.length)];
}

/**
 * Force server-authoritative fields and clamp rewards/counts.
 * @param {object} raw
 * @param {{
 *   giverNpcId: string,
 *   level: number,
 *   catalog?: ReturnType<typeof getQuestCatalog>,
 *   avoidFingerprints?: string[]
 * }} opts
 */
export function sanitizeGeneratedQuest(
  raw,
  { giverNpcId, level, catalog = getQuestCatalog(), avoidFingerprints = [] }
) {
  const budget = clampRewardBudget(level);
  const id = allocateGeneratedQuestId();
  const turnIn =
    typeof raw.turnInNpcId === 'string' && catalog.npcIds.includes(raw.turnInNpcId)
      ? raw.turnInNpcId
      : giverNpcId;

  const avoidedMonsters = avoidFingerprints
    .filter((fp) => fp.startsWith('kill:'))
    .map((fp) => fp.split(':')[1])
    .filter(Boolean);
  const avoidedMaps = avoidFingerprints
    .filter((fp) => fp.startsWith('kill:'))
    .map((fp) => fp.split(':')[2])
    .filter(Boolean);
  const avoidedItems = avoidFingerprints
    .filter((fp) => fp.startsWith('fetch:'))
    .map((fp) => fp.split(':')[1])
    .filter(Boolean);

  const objectives = (Array.isArray(raw.objectives) ? raw.objectives : [])
    .slice(0, 1)
    .map((objective) => {
      if (!objective || typeof objective !== 'object') return null;
      if (objective.type === 'kill') {
        const monsterType = catalog.monsterTypes.includes(objective.monsterType)
          ? objective.monsterType
          : pickRandom(catalog.monsterTypes, avoidedMonsters);
        const requiredMapId = catalog.mapIds.includes(objective.requiredMapId)
          ? objective.requiredMapId
          : pickRandom(catalog.mapIds, avoidedMaps);
        const count = Math.min(
          MAX_COUNT,
          Math.max(MIN_COUNT, Math.floor(Number(objective.count) || 3))
        );
        return { type: 'kill', monsterType, count, requiredMapId };
      }
      if (objective.type === 'fetch') {
        const itemKey = catalog.itemKeys.includes(objective.itemKey)
          ? objective.itemKey
          : pickRandom(catalog.itemKeys, avoidedItems);
        const count = Math.min(
          MAX_COUNT,
          Math.max(MIN_COUNT, Math.floor(Number(objective.count) || 1))
        );
        return { type: 'fetch', itemKey, count };
      }
      if (objective.type === 'talk') {
        const npcId =
          catalog.npcIds.includes(objective.npcId) && objective.npcId !== giverNpcId
            ? objective.npcId
            : catalog.npcIds.find((entry) => entry !== giverNpcId) ?? catalog.npcIds[0];
        return { type: 'talk', npcId };
      }
      return null;
    })
    .filter(Boolean);

  if (objectives.length === 0) {
    objectives.push({
      type: 'kill',
      monsterType: pickRandom(catalog.monsterTypes, avoidedMonsters),
      count: 3,
      requiredMapId: pickRandom(catalog.mapIds, avoidedMaps),
    });
  }

  // If sanitized objective still collides, nudge kill/fetch targets.
  let fingerprint = questObjectiveFingerprint({ objectives });
  if (avoidFingerprints.includes(fingerprint) && objectives[0]?.type === 'kill') {
    objectives[0] = {
      ...objectives[0],
      monsterType: pickRandom(catalog.monsterTypes, [objectives[0].monsterType, ...avoidedMonsters]),
      requiredMapId: pickRandom(catalog.mapIds, [objectives[0].requiredMapId, ...avoidedMaps]),
    };
    fingerprint = questObjectiveFingerprint({ objectives });
  } else if (avoidFingerprints.includes(fingerprint) && objectives[0]?.type === 'fetch') {
    objectives[0] = {
      ...objectives[0],
      itemKey: pickRandom(catalog.itemKeys, [objectives[0].itemKey, ...avoidedItems]),
    };
  }

  const dialogue = raw.dialogue && typeof raw.dialogue === 'object' ? raw.dialogue : {};
  const asLines = (value, fallback) => {
    if (Array.isArray(value) && value.every((line) => typeof line === 'string') && value.length) {
      return value.slice(0, 4).map((line) => line.slice(0, 160));
    }
    return fallback;
  };

  const title =
    typeof raw.title === 'string' && raw.title.trim()
      ? raw.title.trim().slice(0, 64)
      : 'A New Task';

  const rewardItems = [];
  for (const item of raw.rewards?.items ?? []) {
    if (catalog.rewardTemplateKeys.includes(item?.templateKey)) {
      rewardItems.push({
        templateKey: item.templateKey,
        rarity: typeof item.rarity === 'string' ? item.rarity : 'common',
      });
    }
    if (rewardItems.length >= 1) break;
  }

  const xp = Math.min(
    budget.xp,
    Math.max(10, Math.floor(Number(raw.rewards?.xp) || budget.xp))
  );
  const gold = Math.min(
    budget.gold,
    Math.max(5, Math.floor(Number(raw.rewards?.gold) || budget.gold))
  );

  return {
    id,
    title,
    giverNpcId,
    turnInNpcId: turnIn,
    prerequisites: [],
    objectives,
    rewards: {
      xp,
      gold,
      items: rewardItems,
    },
    dialogue: {
      offer: asLines(dialogue.offer, [`I have a task for you: ${title}.`, 'Will you take it?']),
      progress: asLines(dialogue.progress, ['The task is not finished yet.']),
      ready: asLines(dialogue.ready, ['Well done. Claim your reward.']),
      complete: asLines(dialogue.complete, ['You have already completed this task.']),
      ...(Array.isArray(dialogue.atTarget)
        ? { atTarget: asLines(dialogue.atTarget, dialogue.atTarget) }
        : {}),
    },
  };
}

/**
 * @param {{
 *   giverNpcId: string,
 *   level: number,
 *   mapId: string,
 *   activeQuestIds: string[],
 *   completedQuestIds: string[],
 *   recentGeneratedTitles?: string[],
 *   recentFingerprints?: string[],
 *   preferType?: string | null,
 *   seed?: string
 * }} playerContext
 */
export function buildQuestGenerationPrompt(playerContext) {
  const catalog = getQuestCatalog();
  const preferType =
    playerContext.preferType && catalog.objectiveTypes.includes(playerContext.preferType)
      ? playerContext.preferType
      : pickRandom(catalog.objectiveTypes);
  const seed = playerContext.seed ?? randomBytes(3).toString('hex');

  const payload = {
    catalog: {
      npcIds: catalog.npcIds,
      monsterTypes: catalog.monsterTypes,
      mapIds: catalog.mapIds,
      itemKeys: catalog.itemKeys,
      objectiveTypes: catalog.objectiveTypes,
    },
    player: {
      level: playerContext.level,
      mapId: playerContext.mapId,
      activeQuestIds: playerContext.activeQuestIds ?? [],
      completedQuestIds: (playerContext.completedQuestIds ?? []).slice(-12),
      recentGeneratedTitles: playerContext.recentGeneratedTitles ?? [],
      recentObjectiveFingerprints: playerContext.recentFingerprints ?? [],
    },
    constraints: {
      giverNpcId: playerContext.giverNpcId,
      maxObjectives: 1,
      preferType,
      seed,
      mustDifferFromRecent: true,
    },
    instruction:
      'Generate one NEW quest that differs from recentGeneratedTitles and recentObjectiveFingerprints. ' +
      'Change objective type and/or monster/map/item. Do not repeat the same kill target or fetch item.',
  };

  return JSON.stringify(payload);
}

const REPAIR_INSTRUCTION =
  'Fix the previous output into a single valid quest JSON object matching the schema. Use only catalog ids. Output JSON only.';

const DIVERSITY_INSTRUCTION =
  'That quest is too similar to a recent one. Generate a different quest: different title and different objective fingerprint (change type and/or monster/map/item). JSON only.';

/**
 * @param {{
 *   baseUrl: string,
 *   model: string,
 *   timeoutMs?: number,
 *   giverNpcId: string,
 *   level: number,
 *   mapId: string,
 *   activeQuestIds: string[],
 *   completedQuestIds: string[],
 *   recentGeneratedTitles?: string[],
 *   recentFingerprints?: string[],
 *   chat?: typeof ollamaChat
 * }} options
 */
export async function generateQuestFromOllama(options) {
  const chat = options.chat ?? ollamaChat;
  const avoid = {
    titles: options.recentGeneratedTitles ?? [],
    fingerprints: options.recentFingerprints ?? [],
  };
  const userContent = buildQuestGenerationPrompt(options);
  const messages = [{ role: 'user', content: userContent }];

  let lastError = null;
  let duplicateRetries = 0;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { content } = await chat({
        baseUrl: options.baseUrl,
        model: options.model,
        messages,
        timeoutMs: options.timeoutMs,
        format: 'json',
      });
      const parsed = parseQuestJson(content);
      const quest = sanitizeGeneratedQuest(parsed, {
        giverNpcId: options.giverNpcId,
        level: options.level,
        avoidFingerprints: avoid.fingerprints,
      });
      const errors = validateQuestDef(quest, 'generated', { skipPrerequisiteCheck: true });
      if (errors.length) {
        lastError = new Error(errors.join('; '));
        messages.push({ role: 'assistant', content });
        messages.push({ role: 'user', content: REPAIR_INSTRUCTION });
        continue;
      }

      if (isDuplicateGeneratedQuest(quest, avoid) && duplicateRetries < 1) {
        duplicateRetries += 1;
        messages.push({ role: 'assistant', content });
        messages.push({ role: 'user', content: DIVERSITY_INSTRUCTION });
        lastError = new Error('duplicate_quest');
        continue;
      }

      // Last-resort: change the objective only; never append random hex to titles.
      if (isDuplicateGeneratedQuest(quest, avoid)) {
        const nudged = sanitizeGeneratedQuest(
          {
            ...quest,
            objectives: [],
          },
          {
            giverNpcId: options.giverNpcId,
            level: options.level,
            avoidFingerprints: avoid.fingerprints,
          }
        );
        nudged.title = titleFromObjective(nudged.objectives[0]);
        nudged.dialogue = {
          ...(quest.dialogue && typeof quest.dialogue === 'object' ? quest.dialogue : {}),
          offer: [`I have a task for you: ${nudged.title}.`, 'Will you take it?'],
          progress: quest.dialogue?.progress ?? ['The task is not finished yet.'],
          ready: quest.dialogue?.ready ?? ['Well done. Claim your reward.'],
          complete: quest.dialogue?.complete ?? ['You have already completed this task.'],
        };

        // Accept if the objective differs; title may be regenerated cleanly above.
        if (!avoid.fingerprints.includes(questObjectiveFingerprint(nudged))) {
          return { ok: true, quest: nudged };
        }
        lastError = new Error('Could not generate a unique quest');
        continue;
      }

      return { ok: true, quest };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt === 0 && err?.message && !/unreachable|timed out|HTTP/i.test(err.message)) {
        messages.push({ role: 'user', content: REPAIR_INSTRUCTION });
        continue;
      }
      break;
    }
  }

  return {
    ok: false,
    reason: 'generation_failed',
    message: lastError?.message ?? 'Quest generation failed',
  };
}
