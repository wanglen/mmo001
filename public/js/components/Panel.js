/**
 * Base DOM panel with optional backdrop element.
 */
export class Panel {
  /**
   * @param {HTMLElement | null} rootEl
   * @param {{ backdropId?: string | null, backdropEl?: HTMLElement | null }} [options]
   */
  constructor(rootEl, { backdropId = null, backdropEl = null } = {}) {
    this.root = rootEl;
    this.backdropEl = backdropEl ?? (backdropId ? document.getElementById(backdropId) : null);
  }

  isVisible() {
    return !!this.root && !this.root.classList.contains('hidden');
  }

  show() {
    this.root?.classList.remove('hidden');
    this.backdropEl?.classList.remove('hidden');
    this.backdropEl?.setAttribute('aria-hidden', 'false');
    this.root?.setAttribute('aria-hidden', 'false');
  }

  hide() {
    this.root?.classList.add('hidden');
    this.backdropEl?.classList.add('hidden');
    this.backdropEl?.setAttribute('aria-hidden', 'true');
    this.root?.setAttribute('aria-hidden', 'true');
  }
}
