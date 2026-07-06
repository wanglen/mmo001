import { getNpcQuestInteractions, normalizeQuestState } from '/shared/quests.js';

export class DialoguePanel {
  constructor(rootEl) {
    this.root = rootEl;
    this.lines = [];
    this.lineIndex = 0;
    this.onClose = null;
    this.onAccept = null;
    this.onTurnIn = null;
    this.currentNpc = null;
    this.activeInteraction = null;

    this.nameEl = rootEl?.querySelector('[data-dialogue-name]');
    this.textEl = rootEl?.querySelector('[data-dialogue-text]');
    this.questTitleEl = rootEl?.querySelector('[data-dialogue-quest-title]');
    this.nextBtn = rootEl?.querySelector('[data-dialogue-next]');
    this.closeBtn = rootEl?.querySelector('[data-dialogue-close]');
    this.acceptBtn = rootEl?.querySelector('[data-dialogue-accept]');
    this.turnInBtn = rootEl?.querySelector('[data-dialogue-turn-in]');

    this.nextBtn?.addEventListener('click', () => this.advance());
    this.closeBtn?.addEventListener('click', () => this.hide());
    this.acceptBtn?.addEventListener('click', () => this.handleAccept());
    this.turnInBtn?.addEventListener('click', () => this.handleTurnIn());
  }

  isVisible() {
    return this.root && !this.root.classList.contains('hidden');
  }

  show(npc, player, handlers = {}) {
    if (!this.root || !npc) return;

    this.onAccept = handlers.onAccept ?? null;
    this.onTurnIn = handlers.onTurnIn ?? null;
    this.currentNpc = npc;

    const state = normalizeQuestState(player?.quests);
    const interactions = getNpcQuestInteractions(state, player?.inventory ?? [], npc.id);
    this.activeInteraction = interactions[0] ?? null;

    if (this.activeInteraction) {
      this.lines = [...this.activeInteraction.lines];
      if (this.activeInteraction.progressText && this.activeInteraction.status === 'active') {
        this.lines.push(this.activeInteraction.progressText);
      }
    } else {
      this.lines = Array.isArray(npc.dialogue) ? [...npc.dialogue] : [];
    }

    this.lineIndex = 0;
    if (this.nameEl) this.nameEl.textContent = npc.name ?? 'NPC';
    if (this.questTitleEl) {
      this.questTitleEl.textContent = this.activeInteraction?.title ?? '';
      this.questTitleEl.classList.toggle('hidden', !this.activeInteraction?.title);
    }

    this.renderLine();
    this.updateQuestActions();
    this.root.classList.remove('hidden');
  }

  hide() {
    this.root?.classList.add('hidden');
    this.lines = [];
    this.lineIndex = 0;
    this.currentNpc = null;
    this.activeInteraction = null;
    if (this.onClose) this.onClose();
  }

  advance() {
    if (this.lineIndex < this.lines.length - 1) {
      this.lineIndex += 1;
      this.renderLine();
      return;
    }
    this.hide();
  }

  handleAccept() {
    if (!this.activeInteraction?.canAccept || !this.onAccept) return;
    this.onAccept(this.activeInteraction.questId);
    this.hide();
  }

  handleTurnIn() {
    if (!this.activeInteraction?.canTurnIn || !this.onTurnIn) return;
    this.onTurnIn(this.activeInteraction.questId);
    this.hide();
  }

  updateQuestActions() {
    const showAccept = !!this.activeInteraction?.canAccept;
    const showTurnIn = !!this.activeInteraction?.canTurnIn;
    this.acceptBtn?.classList.toggle('hidden', !showAccept);
    this.turnInBtn?.classList.toggle('hidden', !showTurnIn);
  }

  renderLine() {
    if (this.textEl) {
      this.textEl.textContent = this.lines[this.lineIndex] ?? '';
    }
    if (this.nextBtn) {
      this.nextBtn.textContent =
        this.lineIndex < this.lines.length - 1 ? 'Next' : 'Close';
    }
  }
}
