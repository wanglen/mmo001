import { getActiveQuestSummaries, normalizeQuestState } from '/shared/quests.js';

export class QuestTracker {
  constructor(rootEl) {
    this.root = rootEl;
    this.listEl = rootEl?.querySelector('[data-quest-list]');
  }

  update(player) {
    if (!this.root || !this.listEl) return;

    if (!player) {
      this.root.classList.add('hidden');
      return;
    }

    const summaries = getActiveQuestSummaries(
      normalizeQuestState(player.quests),
      player.inventory ?? []
    );

    if (!summaries.length) {
      this.root.classList.add('hidden');
      this.listEl.innerHTML = '';
      return;
    }

    this.root.classList.remove('hidden');
    this.listEl.innerHTML = summaries
      .map(
        (quest) => `
      <li class="quest-tracker-item${quest.ready ? ' quest-tracker-item--ready' : ''}">
        <span class="quest-tracker-title">${quest.title}</span>
        <span class="quest-tracker-progress">${quest.progressText}</span>
      </li>`
      )
      .join('');
  }
}
