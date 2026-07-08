import { WORLD_EVENT_TYPE } from '/shared/worldLog.js';

const TOAST_DURATION_MS = 4200;
const FADE_MS = 280;
const MAX_TOASTS = 4;

const TYPE_LABELS = {
  [WORLD_EVENT_TYPE.KILL]: 'Kill',
  [WORLD_EVENT_TYPE.LEVEL_UP]: 'Level',
  [WORLD_EVENT_TYPE.QUEST]: 'Quest',
  [WORLD_EVENT_TYPE.PARTY]: 'Party',
  [WORLD_EVENT_TYPE.TRADE]: 'Trade',
  [WORLD_EVENT_TYPE.LOOT]: 'Loot',
  [WORLD_EVENT_TYPE.SYSTEM]: 'System',
};

export class WorldEventPanel {
  constructor(rootEl) {
    this.root = rootEl;
    /** @type {Map<HTMLElement, ReturnType<typeof setTimeout>>} */
    this.dismissTimers = new Map();
  }

  /** @param {import('/shared/worldLog.js').WorldEvent} event */
  append(event) {
    if (!event?.text || !this.root) return;
    this.show();

    const toast = document.createElement('div');
    toast.className = `world-event-toast world-event-toast--${event.type}`;
    const label = TYPE_LABELS[event.type] ?? 'Event';
    toast.innerHTML = `<span class="world-event-tag">${escapeHtml(label)}</span> ${escapeHtml(event.text)}`;
    this.root.appendChild(toast);

    while (this.root.children.length > MAX_TOASTS) {
      const oldest = this.root.firstElementChild;
      if (oldest) this.removeToast(oldest, false);
    }

    requestAnimationFrame(() => toast.classList.add('world-event-toast--visible'));

    const timer = setTimeout(() => this.removeToast(toast, true), TOAST_DURATION_MS);
    this.dismissTimers.set(toast, timer);
  }

  /** @param {HTMLElement} toast @param {boolean} animate */
  removeToast(toast, animate) {
    const timer = this.dismissTimers.get(toast);
    if (timer) {
      clearTimeout(timer);
      this.dismissTimers.delete(toast);
    }
    if (!toast.isConnected) return;

    if (!animate) {
      toast.remove();
      return;
    }

    toast.classList.remove('world-event-toast--visible');
    toast.classList.add('world-event-toast--leaving');
    setTimeout(() => toast.remove(), FADE_MS);
  }

  show() {
    this.root?.classList.remove('hidden');
  }

  hide() {
    if (!this.root) return;
    for (const toast of [...this.root.children]) {
      this.removeToast(/** @type {HTMLElement} */ (toast), false);
    }
    this.root.classList.add('hidden');
  }
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
