/** Modal shown when the server ends the session; reloads for a fresh socket. */
export class DisconnectModal {
  constructor(rootEl, messageEl, buttonEl) {
    this.root = rootEl;
    this.messageEl = messageEl;
    this.buttonEl = buttonEl;
    this.onReload = null;
    this.shown = false;

    this.buttonEl?.addEventListener('click', () => {
      if (this.onReload) this.onReload();
      else window.location.reload();
    });
  }

  show(message) {
    if (this.shown || !this.root) return;
    this.shown = true;
    if (this.messageEl) this.messageEl.textContent = message;
    this.root.classList.remove('hidden');
  }
}
