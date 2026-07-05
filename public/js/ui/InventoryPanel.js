import { INVENTORY_COLS, INVENTORY_ROWS } from '/shared/inventory.js';
import { getRarityColor } from '/shared/items.js';
import { EQUIP_SLOTS } from '/shared/items.js';

const SLOT_LABELS = {
  weapon: 'Wpn',
  helm: 'Helm',
  chest: 'Chest',
  gloves: 'Glv',
  boots: 'Boots',
  ring: 'Ring',
  amulet: 'Amu',
};

export class InventoryPanel {
  constructor(rootEl) {
    this.root = rootEl;
    this.onEquip = null;
    this.onUnequip = null;
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
    `;

    this.equipmentEl = this.root.querySelector('#equipment-slots');
    this.gridEl = this.root.querySelector('#inventory-grid');

    for (const slot of EQUIP_SLOTS) {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'equip-slot';
      el.dataset.slot = slot;
      el.title = slot;
      el.innerHTML = `<span class="slot-label">${SLOT_LABELS[slot]}</span>`;
      el.addEventListener('click', () => {
        if (this.onUnequip) this.onUnequip(slot);
      });
      this.equipmentEl.appendChild(el);
    }

    for (let i = 0; i < INVENTORY_COLS * INVENTORY_ROWS; i++) {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'inv-slot';
      el.dataset.index = String(i);
      el.addEventListener('click', () => {
        if (this.onEquip) this.onEquip(i);
      });
      this.gridEl.appendChild(el);
    }
  }

  setVisible(visible) {
    this.root.classList.toggle('hidden', !visible);
  }

  update(player) {
    if (!player) return;

    const equipSlots = this.equipmentEl.querySelectorAll('.equip-slot');
    for (const el of equipSlots) {
      const slot = el.dataset.slot;
      const item = player.equipment?.[slot];
      this.renderSlot(el, item, SLOT_LABELS[slot]);
    }

    const invSlots = this.gridEl.querySelectorAll('.inv-slot');
    for (const el of invSlots) {
      const index = Number(el.dataset.index);
      const item = player.inventory?.[index] ?? null;
      this.renderSlot(el, item);
    }
  }

  renderSlot(el, item, fallbackLabel = '') {
    el.style.borderColor = item ? getRarityColor(item.rarity) : '#333';
    el.title = item ? this.itemTooltip(item) : fallbackLabel;
    if (item) {
      el.textContent = item.name.slice(0, 3);
    } else if (fallbackLabel) {
      el.innerHTML = `<span class="slot-label">${fallbackLabel}</span>`;
    } else {
      el.textContent = '';
    }
    el.classList.toggle('has-item', Boolean(item));
  }

  itemTooltip(item) {
    const stats = Object.entries(item.stats ?? {})
      .map(([k, v]) => `+${v} ${k.toUpperCase()}`)
      .join(', ');
    return `${item.name} (${item.rarity})${stats ? ` — ${stats}` : ''}`;
  }
}
