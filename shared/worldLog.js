import { MONSTER_TYPES } from './monsters.js';
import { getQuestDef } from './quests.js';
import { formatPickupMessage } from './lootRules.js';

export const WORLD_EVENT_TYPE = {
  KILL: 'kill',
  LEVEL_UP: 'levelUp',
  QUEST: 'quest',
  PARTY: 'party',
  TRADE: 'trade',
  LOOT: 'loot',
  SYSTEM: 'system',
};

/**
 * @typedef {typeof WORLD_EVENT_TYPE[keyof typeof WORLD_EVENT_TYPE]} WorldEventType
 * @typedef {{ type: WorldEventType, text: string, at: number }} WorldEvent
 */

/**
 * @param {{ type: WorldEventType, text: string, at?: number }} params
 * @returns {WorldEvent}
 */
export function formatWorldEvent({ type, text, at = Date.now() }) {
  const line = typeof text === 'string' ? text.trim() : '';
  if (!line) throw new Error('world event text required');
  return { type, text: line, at };
}

/**
 * @param {{ killerName: string, monsterLabel: string, isSelf?: boolean }} params
 */
export function formatKillEvent({ killerName, monsterLabel, isSelf = false }) {
  const monster = monsterLabel?.trim() || 'enemy';
  const text = isSelf
    ? `You slayed ${monster}.`
    : `${killerName?.trim() || 'Someone'} slayed ${monster}.`;
  return formatWorldEvent({ type: WORLD_EVENT_TYPE.KILL, text });
}

/** @param {{ level: number, levelsGained?: number }} params */
export function formatLevelUpEvent({ level, levelsGained = 1 }) {
  const gained = Math.max(1, levelsGained ?? 1);
  const text =
    gained > 1 ? `You reached level ${level}! (+${gained} levels)` : `You reached level ${level}!`;
  return formatWorldEvent({ type: WORLD_EVENT_TYPE.LEVEL_UP, text });
}

/** @param {{ questTitle: string }} params */
export function formatQuestAcceptedEvent({ questTitle }) {
  const title = questTitle?.trim() || 'Quest';
  return formatWorldEvent({
    type: WORLD_EVENT_TYPE.QUEST,
    text: `Quest accepted: ${title}`,
  });
}

/** @param {{ questTitle: string }} params */
export function formatQuestCompletedEvent({ questTitle }) {
  const title = questTitle?.trim() || 'Quest';
  return formatWorldEvent({
    type: WORLD_EVENT_TYPE.QUEST,
    text: `Quest completed: ${title}`,
  });
}

/** @param {{ questTitle: string, progressText: string }} params */
export function formatQuestProgressEvent({ questTitle, progressText }) {
  const title = questTitle?.trim() || 'Quest';
  const detail = progressText?.trim() || '';
  return formatWorldEvent({
    type: WORLD_EVENT_TYPE.QUEST,
    text: detail ? `${title}: ${detail}` : title,
  });
}

/** @param {string} text */
export function formatPartyEvent(text) {
  return formatWorldEvent({ type: WORLD_EVENT_TYPE.PARTY, text });
}

/** @param {string} text */
export function formatTradeEvent(text) {
  return formatWorldEvent({ type: WORLD_EVENT_TYPE.TRADE, text });
}

/** @param {string} itemName */
export function formatLootEvent(itemName) {
  return formatWorldEvent({ type: WORLD_EVENT_TYPE.LOOT, text: formatPickupMessage(itemName) });
}

/**
 * Quest kill notifications to emit before applying the kill increment.
 * @param {object} player
 * @param {string} monsterType
 * @returns {Array<{ type: string, text: string, at: number }>}
 */
export function getQuestKillNotifications(player, monsterType) {
  const active = player?.questState?.active;
  if (!active || !monsterType) return [];

  const events = [];
  for (const questId of Object.keys(active)) {
    const quest = getQuestDef(questId);
    if (!quest) continue;

    const entry = active[questId];
    for (const objective of quest.objectives ?? []) {
      if (objective.type !== 'kill' || objective.monsterType !== monsterType) continue;

      const current = entry?.progress?.kill?.[monsterType] ?? 0;
      const max = objective.count ?? 1;
      if (current >= max) continue;

      const next = current + 1;
      const label = MONSTER_TYPES[monsterType]?.label ?? monsterType;
      if (next >= max) {
        events.push(
          formatQuestProgressEvent({
            questTitle: quest.title,
            progressText: 'objective complete — return to turn in',
          })
        );
      } else {
        events.push(
          formatQuestProgressEvent({
            questTitle: quest.title,
            progressText: `${next}/${max} ${label}`,
          })
        );
      }
    }
  }

  return events;
}
