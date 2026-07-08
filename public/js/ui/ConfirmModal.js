/**
 * In-game confirmation dialog (overlay + panel) for destructive or irreversible actions.
 */
export class ConfirmModal {
  /**
   * @param {HTMLElement | null} rootEl
   * @param {{ titleEl?: HTMLElement | null, messageEl?: HTMLElement | null, confirmBtn?: HTMLButtonElement | null, cancelBtn?: HTMLButtonElement | null }} elements
   */
  constructor(rootEl, { titleEl, messageEl, confirmBtn, cancelBtn } = {}) {
    this.root = rootEl;
    this.titleEl = titleEl ?? null;
    this.messageEl = messageEl ?? null;
    this.confirmBtn = confirmBtn ?? null;
    this.cancelBtn = cancelBtn ?? null;
    this.pendingResolve = null;
    this.onKeyDown = (event) => this.handleKeyDown(event);

    this.confirmBtn?.addEventListener('click', () => this.finish(true));
    this.cancelBtn?.addEventListener('click', () => this.finish(false));
    this.root?.addEventListener('click', (event) => {
      if (event.target === this.root) this.finish(false);
    });
  }

  isVisible() {
    return !!this.root && !this.root.classList.contains('hidden');
  }

  /**
   * @param {{ title?: string, message: string, confirmLabel?: string, cancelLabel?: string, danger?: boolean }} options
   * @returns {Promise<boolean>}
   */
  ask(options) {
    if (!this.root || !options?.message) return Promise.resolve(false);
    if (this.pendingResolve) {
      this.finish(false);
    }

    if (this.titleEl) {
      this.titleEl.textContent = options.title ?? 'Confirm';
    }
    if (this.messageEl) {
      this.messageEl.textContent = options.message;
    }
    if (this.confirmBtn) {
      this.confirmBtn.textContent = options.confirmLabel ?? 'Confirm';
      this.confirmBtn.classList.toggle('btn-danger', !!options.danger);
    }
    if (this.cancelBtn) {
      this.cancelBtn.textContent = options.cancelLabel ?? 'Cancel';
    }

    this.root.classList.remove('hidden');
    document.addEventListener('keydown', this.onKeyDown, true);
    this.confirmBtn?.focus();

    return new Promise((resolve) => {
      this.pendingResolve = resolve;
    });
  }

  hide() {
    this.root?.classList.add('hidden');
    document.removeEventListener('keydown', this.onKeyDown, true);
  }

  finish(confirmed) {
    const resolve = this.pendingResolve;
    this.pendingResolve = null;
    this.hide();
    resolve?.(confirmed);
  }

  handleKeyDown(event) {
    if (!this.isVisible()) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.finish(false);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      this.finish(true);
    }
  }
}
