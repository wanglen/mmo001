/**
 * Tracks registered UI panels and centralizes show/hide.
 */
export class UIManager {
  constructor() {
    /** @type {Map<string, { panel: object, blocksInput: boolean }>} */
    this.panels = new Map();
    this.zIndexBase = 100;
  }

  /**
   * @param {string} id
   * @param {object} panel — must expose show/hide/isVisible when used modally
   * @param {{ blocksInput?: boolean, zIndex?: number }} [options]
   */
  register(id, panel, { blocksInput = false, zIndex = null } = {}) {
    this.panels.set(id, { panel, blocksInput });
    if (zIndex != null && panel.root?.style) {
      panel.root.style.zIndex = String(this.zIndexBase + zIndex);
    }
  }

  /** @param {string} id */
  get(id) {
    return this.panels.get(id)?.panel ?? null;
  }

  /** @param {string} id */
  show(id) {
    this.panels.get(id)?.panel?.show?.();
  }

  /** @param {string} id */
  hide(id) {
    this.panels.get(id)?.panel?.hide?.();
  }

  hideAll() {
    for (const { panel } of this.panels.values()) {
      panel.hide?.();
    }
  }

  blocksGameInput() {
    for (const { panel, blocksInput } of this.panels.values()) {
      if (blocksInput && panel.isVisible?.()) return true;
    }
    return false;
  }
}
