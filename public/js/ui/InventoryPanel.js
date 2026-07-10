import { INVENTORY_COLS, INVENTORY_ROWS } from '/shared/inventory.js';
import { isConsumable } from '/shared/consumables.js';
import { isGem } from '/shared/plugins/items/gems.js';
import { listSocketTargets } from '/shared/plugins/items/socketUi.js';
import { EQUIP_SLOTS } from '/shared/items.js';
import { buildSlotIconHtml, buildItemIconSvg, getInventoryIconColor } from './itemIcons.js';
import { resolveItemIconKey } from '/shared/itemIcons.js';
import { buildItemTooltipHtml, buildSlotHintHtml } from '/shared/itemDisplay.js';
import { getItemTooltip } from './ItemTooltip.js';

const EMPTY_SLOT_COLOR = '#4a5a6a';

export class InventoryPanel {
  constructor(rootEl, confirmModal = null) {
    this.root = rootEl;
    this.confirmModal = confirmModal;
    this.onEquip = null;
    this.onUnequip = null;
    this.onUseConsumable = null;
    this.onDestroy = null;
    this.onStoreInStash = null;
    this.onSocketGem = null;
    this.onSort = null;
    this.townFeaturesEnabled = false;
    this.player = null;
    this.inspectKey = '';
    this.activeSlotEl = null;
    this.contextMenuEl = null;
    this.tooltip = getItemTooltip();
    this.build();
  }

  build() {
    this.root.innerHTML = `
      <div class="inventory-header">
        <span class="inventory-title">Inventory</span>
        <div class="inventory-header-actions">
          <button type="button" class="inventory-sort-btn" id="inventory-sort-btn" title="Sort by type and rarity">Sort</button>
          <span class="inventory-hint">I or Esc close · Hover items for details · Right-click menu</span>
        </div>
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
    `;

    this.equipmentEl = this.root.querySelector('#equipment-slots');
    this.gridEl = this.root.querySelector('#inventory-grid');

    this.root.querySelector('#inventory-sort-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onSort?.();
    });

    const hoverZone = this.root;
    hoverZone.addEventListener('mouseleave', (e) => {
      if (hoverZone.contains(e.relatedTarget)) return;
      this.clearInspect();
    });

    document.addEventListener('click', () => this.hideContextMenu());
    document.addEventListener('contextmenu', () => this.hideContextMenu());
    window.addEventListener('blur', () => {
      this.hideContextMenu();
      this.clearInspect();
    });

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
    if (!visible) {
      this.hideContextMenu();
      this.clearInspect();
    }
  }

  update(player, options = {}) {
    if (!player) return;

    this.player = player;
    this.townFeaturesEnabled = !!options.townFeaturesEnabled;

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

    if (isGem(item)) return;

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

    if (isGem(item)) {
      const actions = [{ id: 'destroy', label: 'Destroy' }];
      if (this.townFeaturesEnabled && this.onStoreInStash) {
        actions.unshift({ id: 'stash', label: 'Store in stash' });
      }
      const targets = listSocketTargets(this.player ?? {});
      for (const target of targets) {
        actions.push({
          id: target.replace ? 'replace' : 'socket',
          label: target.replace
            ? `Replace ${target.occupiedGemName} in ${target.label}`
            : `Socket into ${target.label}`,
          target,
        });
      }
      return actions;
    }

    const actions = [
      { id: 'primary', label: 'Equip' },
      { id: 'destroy', label: 'Destroy' },
    ];
    if (this.townFeaturesEnabled && this.onStoreInStash) {
      actions.splice(1, 0, { id: 'stash', label: 'Store in stash' });
    }
    return actions;
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
      button.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (action.id === 'primary') {
          this.handlePrimaryAction(slotEl);
        } else if (action.id === 'stash') {
          this.onStoreInStash?.(Number(slotEl.dataset.index));
        } else if ((action.id === 'socket' || action.id === 'replace') && action.target) {
          const gemIndex = Number(slotEl.dataset.index);
          const gem = this.getItemFromSlotEl(slotEl);
          this.hideContextMenu();
          if (action.id === 'replace') {
            const confirmed = await this.confirmSocketReplace(gem, action.target);
            if (!confirmed) return;
          }
          const payload = {
            gemInventoryIndex: gemIndex,
            socketIndex: action.target.socketIndex ?? undefined,
          };
          if (action.target.kind === 'inventory') {
            payload.targetInventoryIndex = action.target.index;
          } else {
            payload.targetSlot = action.target.slot;
          }
          this.onSocketGem?.(payload);
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

  confirmSocketReplace(gem, target) {
    if (!this.confirmModal) return Promise.resolve(false);

    const gemName = gem?.name ?? 'this gem';
    return this.confirmModal.ask({
      title: 'Replace socketed gem?',
      message: `Replace ${target.occupiedGemName} in ${target.label} with ${gemName}? The replaced gem returns to your inventory.`,
      confirmLabel: 'Replace',
      cancelLabel: 'Cancel',
      danger: true,
    });
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
      const iconHtml = buildItemIconSvg(iconKey);
      const tooltipHtml = buildItemTooltipHtml(item, {
        actionHint,
        compareWith,
        compareHeader: compareWith ? `vs ${compareWith.name}` : '',
        iconHtml: `<span style="color: ${iconColor}">${iconHtml}</span>`,
      });
      this.tooltip.show(slotEl, tooltipHtml);
      return;
    }

    this.activeSlotEl = null;
    const hintHtml = slotEl.classList.contains('equip-slot')
      ? buildSlotHintHtml(slotEl.dataset.slot)
      : '';
    this.tooltip.show(slotEl, hintHtml || '');
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
    this.tooltip.hide();
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
