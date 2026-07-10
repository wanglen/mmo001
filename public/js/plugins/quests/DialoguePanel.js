import {
  getNpcQuestInteractions,
  normalizeQuestState,
} from '/shared/quests.js';
import { isQuestNpcId } from '/shared/content/questCatalog.js';

export class DialoguePanel {
  constructor(rootEl) {
    this.root = rootEl;
    this.lines = [];
    this.lineIndex = 0;
    this.onClose = null;
    this.onAccept = null;
    this.onTurnIn = null;
    this.onGenerate = null;
    this.onGeneratingChange = null;
    this.currentNpc = null;
    this.activeInteraction = null;
    this.playerSnapshot = null;
    this.generating = false;

    this.nameEl = rootEl?.querySelector('[data-dialogue-name]');
    this.textEl = rootEl?.querySelector('[data-dialogue-text]');
    this.questTitleEl = rootEl?.querySelector('[data-dialogue-quest-title]');
    this.nextBtn = rootEl?.querySelector('[data-dialogue-next]');
    this.closeBtn = rootEl?.querySelector('[data-dialogue-close]');
    this.acceptBtn = rootEl?.querySelector('[data-dialogue-accept]');
    this.turnInBtn = rootEl?.querySelector('[data-dialogue-turn-in]');
    this.generateBtn = rootEl?.querySelector('[data-dialogue-generate]');
    this.thinkingEl = rootEl?.querySelector('[data-dialogue-thinking]');

    this.nextBtn?.addEventListener('click', () => this.advance());
    this.closeBtn?.addEventListener('click', () => this.hide());
    this.acceptBtn?.addEventListener('click', () => this.handleAccept());
    this.turnInBtn?.addEventListener('click', () => this.handleTurnIn());
    this.generateBtn?.addEventListener('click', () => this.handleGenerate());
  }

  isVisible() {
    return this.root && !this.root.classList.contains('hidden');
  }

  show(npc, player, handlers = {}) {
    if (!this.root || !npc) return;

    this.onAccept = handlers.onAccept ?? null;
    this.onTurnIn = handlers.onTurnIn ?? null;
    this.onGenerate = handlers.onGenerate ?? null;
    this.onGeneratingChange = handlers.onGeneratingChange ?? null;
    this.currentNpc = npc;
    this.playerSnapshot = player ?? null;
    this.setGenerating(false);

    this.refreshContent(player);
    this.root.classList.remove('hidden');
  }

  /**
   * Re-read quest interactions from the latest player snapshot (e.g. after generation).
   * @param {object | null | undefined} [player]
   */
  refreshContent(player = this.playerSnapshot) {
    if (!this.root || !this.currentNpc) return;
    this.playerSnapshot = player ?? this.playerSnapshot;

    // Keep the loading line while Ollama is working; still update action buttons.
    if (this.generating) {
      this.updateQuestActions();
      return;
    }

    const state = normalizeQuestState(this.playerSnapshot?.quests);
    const interactions = getNpcQuestInteractions(
      state,
      this.playerSnapshot?.inventory ?? [],
      this.currentNpc.id
    );
    this.activeInteraction = interactions[0] ?? null;

    if (this.activeInteraction) {
      this.lines = [...(this.activeInteraction.lines ?? [])];
      if (this.activeInteraction.progressText && this.activeInteraction.status === 'active') {
        this.lines.push(this.activeInteraction.progressText);
      }
    } else {
      this.lines = Array.isArray(this.currentNpc.dialogue)
        ? [...this.currentNpc.dialogue]
        : [];
    }

    this.lineIndex = 0;
    if (this.nameEl) this.nameEl.textContent = this.currentNpc.name ?? 'NPC';
    if (this.questTitleEl) {
      this.questTitleEl.textContent = this.activeInteraction?.title ?? '';
      this.questTitleEl.classList.toggle('hidden', !this.activeInteraction?.title);
    }

    this.renderLine();
    this.updateQuestActions();
  }

  hide() {
    this.root?.classList.add('hidden');
    this.lines = [];
    this.lineIndex = 0;
    this.currentNpc = null;
    this.activeInteraction = null;
    this.playerSnapshot = null;
    this.setGenerating(false);
    if (this.onClose) this.onClose();
  }

  advance() {
    if (this.generating) return;
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

  handleGenerate() {
    if (!this.onGenerate || !this.currentNpc || this.generating) return;
    this.setGenerating(true);
    this.onGenerate(this.currentNpc.id);
  }

  setGenerating(generating) {
    this.generating = !!generating;
    this.thinkingEl?.classList.toggle('hidden', !this.generating);
    this.root?.classList.toggle('dialogue-panel--thinking', this.generating);
    if (this.textEl) {
      this.textEl.classList.toggle('dialogue-text--muted', this.generating);
      if (this.generating) {
        this.textEl.textContent = '';
      }
    }
    if (this.nextBtn) this.nextBtn.disabled = this.generating;
    if (this.closeBtn) this.closeBtn.disabled = this.generating;
    this.updateQuestActions();
    this.onGeneratingChange?.(this.generating, this.currentNpc?.id ?? null);
  }

  updateQuestActions() {
    const showAccept = !!this.activeInteraction?.canAccept && !this.generating;
    const showTurnIn = !!this.activeInteraction?.canTurnIn && !this.generating;
    const canRequest =
      !!this.onGenerate &&
      !!this.currentNpc &&
      isQuestNpcId(this.currentNpc.id) &&
      !showAccept &&
      !showTurnIn &&
      !this.generating;

    this.acceptBtn?.classList.toggle('hidden', !showAccept);
    this.turnInBtn?.classList.toggle('hidden', !showTurnIn);
    this.generateBtn?.classList.toggle('hidden', !canRequest);
    if (this.generateBtn) {
      this.generateBtn.disabled = this.generating;
      this.generateBtn.textContent = this.generating ? 'Requesting…' : 'Request a task';
    }
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
