import { INVENTORY_COLS, INVENTORY_ROWS } from '/shared/inventory.js';
import { isConsumable } from '/shared/consumables.js';
import { EQUIP_SLOTS } from '/shared/items.js';
import { buildSlotIconHtml, buildItemIconSvg, getInventoryIconColor } from './itemIcons.js';
import { resolveItemIconKey } from '/shared/itemIcons.js';
import {
  buildEmptyInspectHtml,
  buildItemInspectHtml,
  buildSlotHintHtml,
} from '/shared/itemDisplay.js';

const EMPTY_SLOT_COLOR = '#4a5a6a';

export class InventoryPanel {
  constructor(rootEl) {
    this.root = rootEl;
    this.onEquip = null;
    this.onUnequip = null;
    this.onUseConsumable = null;
    this.onDestroy = null;
    this.player = null;
    this.inspectKey = '';
    this.activeSlotEl = null;
    this.contextMenuEl = null;
    this.build();
  }

  build() {
    this.root.innerHTML = `
      <div class="inventory-header">
        <span class="inventory-title">Inventory</span>
        <span class="inventory-hint">I or Esc close · Right-click item menu</span>
      </div>
      <div class="inventory-main">
        <section class="inventory-equipment-section" aria-label="Equipped items">
          <h3 class="inventory-section-label">Equipped</h3>
          <div class="equipment-slots" id="equipment-slots"></div>
        </section>
        <section class="inventory-bag-section" aria-label="Backpack">
          <h3 class="inventory-section-label">Backpack</h3>
          <div class="inventory-grid" id="inventory-grid"></div>
        </section>
      </div>
      <div class="item-inspect" id="item-inspect" aria-live="polite">
        ${buildEmptyInspectHtml()}
      </div>
    `;

    this.equipmentEl = this.root.querySelector('#equipment-slots');
    this.gridEl = this.root.querySelector('#inventory-grid');
    this.inspectEl = this.root.querySelector('#item-inspect');

    const hoverZone = this.root;
    hoverZone.addEventListener('mouseleave', (e) => {
      if (hoverZone.contains(e.relatedTarget)) return;
      this.clearInspect();
    });

    document.addEventListener('click', () => this.hideContextMenu());
    document.addEventListener('contextmenu', () => this.hideContextMenu());
    window.addEventListener('blur', () => this.hideContextMenu());

    for (const slot of EQUIP_SLOTS) {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'equip-slot';
      el.dataset.slot = slot;
      el.addEventListener('click', () => this.handlePrimaryAction(el));
      el.addEventListener('mouseenter', () => this.inspectSlot(el));
      el.addEventListener('contextmenu', (e) => this.showContextMenu(e, el));
      this.equipmentEl.appendChild(el);
    }

    for (let i = 0; i < INVENTORY_COLS * INVENTORY_ROWS; i++) {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'inv-slot';
      el.dataset.index = String(i);
      el.addEventListener('click', () => this.handlePrimaryAction(el));
      el.addEventListener('mouseenter', () => this.inspectSlot(el));
      el.addEventListener('contextmenu', (e) => this.showContextMenu(e, el));
      this.gridEl.appendChild(el);
    }
  }

  setVisible(visible) {
    this.root.classList.toggle('hidden', !visible);
    const backdrop = document.getElementById('inventory-backdrop');
    backdrop?.classList.toggle('hidden', !visible);
    backdrop?.setAttribute('aria-hidden', visible ? 'false' : 'true');
    this.root.setAttribute('aria-hidden', visible ? 'false' : 'true');
  }

  update(player) {
    if (!player) return;

    this.player = player;

    const equipSlots = this.equipmentEl.querySelectorAll('.equip-slot');
    for (const el of equipSlots) {
      const slot = el.dataset.slot;
      const item = player.equipment?.[slot];
      this.renderSlot(el, item, slot);
    }

    const invSlots = this.gridEl.querySelectorAll('.inv-slot');
    for (const el of invSlots) {
      const index = Number(el.dataset.index);
      const item = player.inventory?.[index] ?? null;
      this.renderSlot(el, item);
    }

    if (this.activeSlotEl) {
      this.inspectSlot(this.activeSlotEl, true);
    }
  }

  handlePrimaryAction(slotEl) {
    const item = this.getItemFromSlotEl(slotEl);
    if (!item) return;

    if (slotEl.classList.contains('equip-slot')) {
      if (this.onUnequip) this.onUnequip(slotEl.dataset.slot);
      return;
    }

    const index = Number(slotEl.dataset.index);
    if (isConsumable(item)) {
      if (this.onUseConsumable) this.onUseConsumable(index);
      return;
    }

    if (this.onEquip) this.onEquip(index);
  }

  handleDestroy(slotEl) {
    if (!this.onDestroy) return;

    const item = this.getItemFromSlotEl(slotEl);
    if (!item) return;

    if (slotEl.classList.contains('equip-slot')) {
      this.onDestroy({ slot: slotEl.dataset.slot });
      return;
    }

    this.onDestroy({ inventoryIndex: Number(slotEl.dataset.index) });
  }

  getSlotActions(slotEl) {
    const item = this.getItemFromSlotEl(slotEl);
    if (!item) return [];

    if (slotEl.classList.contains('equip-slot')) {
      return [
        { id: 'primary', label: 'Unequip' },
        { id: 'destroy', label: 'Destroy' },
      ];
    }

    if (isConsumable(item)) {
      return [
        { id: 'primary', label: 'Use' },
        { id: 'destroy', label: 'Destroy' },
      ];
    }

    return [
      { id: 'primary', label: 'Equip' },
      { id: 'destroy', label: 'Destroy' },
    ];
  }

  showContextMenu(event, slotEl) {
    event.preventDefault();
    event.stopPropagation();

    const item = this.getItemFromSlotEl(slotEl);
    if (!item) return;

    this.inspectSlot(slotEl);
    this.hideContextMenu();

    const menu = document.createElement('div');
    menu.className = 'inv-context-menu';
    menu.setAttribute('role', 'menu');

    for (const action of this.getSlotActions(slotEl)) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `inv-context-menu__item${action.id === 'destroy' ? ' inv-context-menu__item--danger' : ''}`;
      button.textContent = action.label;
      button.dataset.action = action.id;
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        if (action.id === 'primary') {
          this.handlePrimaryAction(slotEl);
        } else {
          this.handleDestroy(slotEl);
        }
        this.hideContextMenu();
      });
      menu.appendChild(button);
    }

    document.body.appendChild(menu);
    this.contextMenuEl = menu;

    const menuRect = menu.getBoundingClientRect();
    const maxX = window.innerWidth - menuRect.width - 8;
    const maxY = window.innerHeight - menuRect.height - 8;
    menu.style.left = `${Math.max(8, Math.min(event.clientX, maxX))}px`;
    menu.style.top = `${Math.max(8, Math.min(event.clientY, maxY))}px`;
  }

  hideContextMenu() {
    this.contextMenuEl?.remove();
    this.contextMenuEl = null;
  }

  inspectSlot(slotEl, force = false) {
    const item = this.getItemFromSlotEl(slotEl);
    const key = this.getInspectKey(slotEl, item);
    if (!force && this.inspectKey === key) return;

    this.inspectKey = key;
    this.activeSlotEl = slotEl;
    this.clearSlotInspectHighlight();
    slotEl.classList.add('slot-inspect');

    if (item) {
      const isEquipSlot = slotEl.classList.contains('equip-slot');
      const compareWith =
        !isEquipSlot && item.slot && !isConsumable(item)
          ? this.player?.equipment?.[item.slot] ?? null
          : null;
      const actionHint = isConsumable(item)
        ? 'Click to use · Right-click for menu'
        : isEquipSlot
          ? 'Click to unequip · Right-click for menu'
          : 'Click to equip · Right-click for menu';
      const fallbackSlot = isEquipSlot ? slotEl.dataset.slot : '';
      const iconKey = resolveItemIconKey(item, fallbackSlot);
      const iconColor = getInventoryIconColor(item);
      const iconHtml = `<div class="item-inspect-icon" style="color: ${iconColor}">${buildItemIconSvg(iconKey)}</div>`;
      const detailsHtml = buildItemInspectHtml(item, {
        actionHint,
        compareWith,
        compareHeader: compareWith ? `vs ${compareWith.name}` : '',
      });
      this.showInspect(
        `<div class="item-inspect-layout">${iconHtml}<div class="item-inspect-details">${detailsHtml}</div></div>`
      );
      return;
    }

    this.activeSlotEl = null;
    if (slotEl.classList.contains('equip-slot')) {
      this.showInspect(buildSlotHintHtml(slotEl.dataset.slot));
    } else {
      this.showInspect(buildEmptyInspectHtml('Empty bag slot'));
    }
  }

  getInspectKey(slotEl, item) {
    const itemId = item?.id ?? 'empty';
    if (slotEl.classList.contains('equip-slot')) {
      return `eq:${slotEl.dataset.slot}:${itemId}`;
    }
    return `inv:${slotEl.dataset.index}:${itemId}`;
  }

  clearInspect() {
    this.inspectKey = '';
    this.activeSlotEl = null;
    this.clearSlotInspectHighlight();
    this.showInspect(buildEmptyInspectHtml());
  }

  clearSlotInspectHighlight() {
    for (const el of this.root.querySelectorAll('.slot-inspect')) {
      el.classList.remove('slot-inspect');
    }
  }

  getItemFromSlotEl(el) {
    if (!this.player) return null;

    if (el.classList.contains('equip-slot')) {
      return this.player.equipment?.[el.dataset.slot] ?? null;
    }

    return this.player.inventory?.[Number(el.dataset.index)] ?? null;
  }

  showInspect(html) {
    this.inspectEl.innerHTML = html;
  }

  renderSlot(el, item, slotType = '') {
    const iconColor = getInventoryIconColor(item, EMPTY_SLOT_COLOR);

    el.style.borderColor = item ? iconColor : '#333';
    el.style.setProperty('--slot-icon-color', iconColor);
    el.setAttribute('aria-label', this.slotAriaLabel(item, slotType));
    el.innerHTML = buildSlotIconHtml(item, slotType);
    el.classList.toggle('has-item', Boolean(item));
  }

  slotAriaLabel(item, slotType) {
    if (item) return item.name;
    if (slotType) return `${slotType} slot, empty`;
    return 'Empty bag slot';
  }
}
