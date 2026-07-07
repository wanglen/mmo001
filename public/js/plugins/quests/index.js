import { DialoguePanel } from './DialoguePanel.js';
import { QuestTracker } from './QuestTracker.js';

/** @param {import('../../../../shared/plugins/types.js').ClientContext} ctx */
export function registerQuestsClient(ctx) {
  const dialoguePanel = new DialoguePanel(document.getElementById('dialogue-panel'));
  const questTracker = new QuestTracker(document.getElementById('quest-tracker'));

  ctx.registerPanel('dialogue', dialoguePanel);
  ctx.panels.dialoguePanel = dialoguePanel;
  ctx.panels.questTracker = questTracker;
}

/** @type {import('../../../../shared/plugins/types.js').ClientPlugin} */
export const questsPlugin = {
  id: 'quests',
  dependsOn: ['core'],
  registerClient: registerQuestsClient,
};
