import { STASH_COLS, STASH_ROWS } from '/shared/stash.js';
import { buildSlotIconHtml, getInventoryIconColor } from './itemIcons.js';
import { resolveItemIconKey } from '/shared/itemIcons.js';
import { buildEmptyInspectHtml, buildItemInspectHtml } from '/shared/itemDisplay.js';

const EMPTY_SLOT_COLOR = '#4a5a6a';

export class StashPanel {
  constructor(rootEl) {
    this.root = rootEl;
    this.onTake = null;
    this.player = null;
    this.inspectKey = '';
    this.activeSlotEl = null;
    this.contextMenuEl = null;
    this.build();
  }

  build() {
    this.root.innerHTML = `
      <div class="inventory-header">
        <span class="inventory-title">Shared Stash</span>
        <span class="inventory-hint">Town only · B or Esc close · Right-click to take</span>
      </div>
      <div class="stash-grid" id="stash-grid"></div>
      <div class="item-inspect" id="stash-inspect" aria-live="polite">
        ${buildEmptyInspectHtml('Hover a stash item for details')}
      </div>
    `;

    this.gridEl = this.root.querySelector('#stash-grid');
    this.inspectEl = this.root.querySelector('#stash-inspect');

    for (let i = 0; i < STASH_COLS * STASH_ROWS; i++) {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'inv-slot stash-slot';
      el.dataset.index = String(i);
      el.addEventListener('click', () => this.handleTake(el));
      el.addEventListener('mouseenter', () => this.inspectSlot(el));
      el.addEventListener('contextmenu', (e) => this.showContextMenu(e, el));
      this.gridEl.appendChild(el);
    }

    this.root.addEventListener('mouseleave', (e) => {
      if (this.root.contains(e.relatedTarget)) return;
      this.clearInspect();
    });

    document.addEventListener('click', () => this.hideContextMenu());
  }

  setVisible(visible) {
    this.root.classList.toggle('hidden', !visible);
    if (!visible) {
      this.hideContextMenu();
      this.clearInspect();
    }
  }

  update(player) {
    this.player = player;
    if (!this.gridEl) return;

    const stash = player?.stash ?? [];
    const slots = this.gridEl.querySelectorAll('.stash-slot');
    slots.forEach((el, index) => {
      const item = stash[index] ?? null;
      const iconKey = resolveItemIconKey(item);
      const color = item ? getInventoryIconColor(item) : EMPTY_SLOT_COLOR;
      el.innerHTML = buildSlotIconHtml(iconKey, color, !!item);
      el.classList.toggle('has-item', !!item);
      el.title = item?.name ?? '';
    });
  }

  handleTake(slotEl) {
    const index = Number(slotEl.dataset.index);
    const item = this.player?.stash?.[index];
    if (!item || !this.onTake) return;
    this.onTake(index);
  }

  showContextMenu(event, slotEl) {
    event.preventDefault();
    event.stopPropagation();

    const item = this.player?.stash?.[Number(slotEl.dataset.index)];
    if (!item) return;

    this.inspectSlot(slotEl);
    this.hideContextMenu();

    const menu = document.createElement('div');
    menu.className = 'inv-context-menu';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'inv-context-menu__item';
    button.textContent = 'Take to bag';
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleTake(slotEl);
      this.hideContextMenu();
    });
    menu.appendChild(button);
    document.body.appendChild(menu);
    this.contextMenuEl = menu;
    menu.style.left = `${event.clientX}px`;
    menu.style.top = `${event.clientY}px`;
  }

  hideContextMenu() {
    this.contextMenuEl?.remove();
    this.contextMenuEl = null;
  }

  inspectSlot(slotEl) {
    const item = this.player?.stash?.[Number(slotEl.dataset.index)] ?? null;
    const key = item ? `stash:${item.id}` : `stash-empty:${slotEl.dataset.index}`;
    if (this.inspectKey === key) return;
    this.inspectKey = key;
    this.activeSlotEl?.classList.remove('slot-inspect');
    this.activeSlotEl = slotEl;
    slotEl.classList.add('slot-inspect');
    this.inspectEl.innerHTML = item
      ? buildItemInspectHtml(item, { actionHint: 'Click or right-click to take' })
      : buildEmptyInspectHtml('Empty stash slot');
  }

  clearInspect() {
    this.inspectKey = '';
    this.activeSlotEl?.classList.remove('slot-inspect');
    this.activeSlotEl = null;
    this.inspectEl.innerHTML = buildEmptyInspectHtml('Hover a stash item for details');
  }
}
