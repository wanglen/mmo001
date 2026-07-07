/** Floating Diablo-style item tooltip (fixed position, no layout shift). */
export class ItemTooltip {
  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'item-tooltip hidden';
    this.el.setAttribute('role', 'tooltip');
    document.body.appendChild(this.el);
  }

  /** @param {HTMLElement} anchorEl @param {string} html */
  show(anchorEl, html) {
    if (!html) {
      this.hide();
      return;
    }

    this.el.innerHTML = html;
    this.el.classList.remove('hidden');

    const anchor = anchorEl.getBoundingClientRect();
    const margin = 10;
    let left = anchor.right + margin;
    let top = anchor.top;

    const tip = this.el.getBoundingClientRect();
    if (left + tip.width > window.innerWidth - margin) {
      left = anchor.left - tip.width - margin;
    }
    if (left < margin) left = margin;

    if (top + tip.height > window.innerHeight - margin) {
      top = window.innerHeight - tip.height - margin;
    }
    if (top < margin) top = margin;

    this.el.style.left = `${left}px`;
    this.el.style.top = `${top}px`;
  }

  hide() {
    this.el.classList.add('hidden');
    this.el.innerHTML = '';
  }
}

let sharedTooltip = null;

export function getItemTooltip() {
  if (!sharedTooltip) sharedTooltip = new ItemTooltip();
  return sharedTooltip;
}
