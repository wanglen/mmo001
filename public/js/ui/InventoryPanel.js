import { INVENTORY_COLS, INVENTORY_ROWS } from '/shared/inventory.js';
import { isConsumable } from '/shared/consumables.js';
import { getRarityColor } from '/shared/items.js';
import { EQUIP_SLOTS } from '/shared/items.js';
import { buildSlotIconHtml, buildItemIconSvg } from './itemIcons.js';
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
    this.player = null;
    this.build();
  }

  build() {
    this.root.innerHTML = `
      <div class="inventory-header">
        <span>Inventory</span>
        <span class="inventory-hint">I toggle · C stats</span>
      </div>
      <div class="inventory-body">
        <div class="equipment-slots" id="equipment-slots"></div>
        <div class="inventory-grid" id="inventory-grid"></div>
      </div>
      <div class="item-inspect" id="item-inspect" aria-live="polite">
        ${buildEmptyInspectHtml()}
      </div>
    `;

    this.equipmentEl = this.root.querySelector('#equipment-slots');
    this.gridEl = this.root.querySelector('#inventory-grid');
    this.inspectEl = this.root.querySelector('#item-inspect');
    this.inspectKey = '';

    const hoverZone = this.root.querySelector('.inventory-body');
    hoverZone.addEventListener('mouseleave', (e) => {
      if (hoverZone.contains(e.relatedTarget)) return;
      this.clearInspect();
    });

    for (const slot of EQUIP_SLOTS) {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'equip-slot';
      el.dataset.slot = slot;
      el.addEventListener('click', () => {
        if (this.onUnequip) this.onUnequip(slot);
      });
      el.addEventListener('mouseenter', () => this.inspectSlot(el));
      this.equipmentEl.appendChild(el);
    }

    for (let i = 0; i < INVENTORY_COLS * INVENTORY_ROWS; i++) {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'inv-slot';
      el.dataset.index = String(i);
      el.addEventListener('click', () => {
        const item = this.player?.inventory?.[i] ?? null;
        if (isConsumable(item) && this.onUseConsumable) {
          this.onUseConsumable(i);
          return;
        }
        if (this.onEquip) this.onEquip(i);
      });
      el.addEventListener('mouseenter', () => this.inspectSlot(el));
      this.gridEl.appendChild(el);
    }
  }

  setVisible(visible) {
    this.root.classList.toggle('hidden', !visible);
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
  }

  inspectSlot(slotEl) {
    const item = this.getItemFromSlotEl(slotEl);
    const key = this.getInspectKey(slotEl, item);
    if (this.inspectKey === key) return;

    this.inspectKey = key;
    this.clearSlotInspectHighlight();
    slotEl.classList.add('slot-inspect');

    if (item) {
      const actionHint = isConsumable(item)
        ? 'Click to use'
        : slotEl.classList.contains('equip-slot')
          ? 'Click to unequip'
          : 'Click to equip';
      const fallbackSlot = slotEl.classList.contains('equip-slot') ? slotEl.dataset.slot : '';
      const iconKey = resolveItemIconKey(item, fallbackSlot);
      const iconColor = getRarityColor(item.rarity);
      const iconHtml = `<div class="item-inspect-icon" style="color: ${iconColor}">${buildItemIconSvg(iconKey)}</div>`;
      this.showInspect(iconHtml + buildItemInspectHtml(item, { actionHint }));
      return;
    }

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
    const iconColor = item ? getRarityColor(item.rarity) : EMPTY_SLOT_COLOR;

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
