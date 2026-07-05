export class DialoguePanel {
  constructor(rootEl) {
    this.root = rootEl;
    this.lines = [];
    this.lineIndex = 0;
    this.onClose = null;

    this.nameEl = rootEl?.querySelector('[data-dialogue-name]');
    this.textEl = rootEl?.querySelector('[data-dialogue-text]');
    this.nextBtn = rootEl?.querySelector('[data-dialogue-next]');
    this.closeBtn = rootEl?.querySelector('[data-dialogue-close]');

    this.nextBtn?.addEventListener('click', () => this.advance());
    this.closeBtn?.addEventListener('click', () => this.hide());
  }

  isVisible() {
    return this.root && !this.root.classList.contains('hidden');
  }

  show(npc) {
    if (!this.root || !npc) return;
    this.lines = Array.isArray(npc.dialogue) ? npc.dialogue : [];
    this.lineIndex = 0;
    if (this.nameEl) this.nameEl.textContent = npc.name ?? 'NPC';
    this.renderLine();
    this.root.classList.remove('hidden');
  }

  hide() {
    this.root?.classList.add('hidden');
    this.lines = [];
    this.lineIndex = 0;
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
