import { createEmptyQuestState, questStateToJSON } from '../../../shared/quests.js';

/** @param {import('../players/Player.js').Player} player */
export function serializeQuestPlayer(player) {
  return {
    quests: questStateToJSON(player.questState ?? createEmptyQuestState()),
  };
}
