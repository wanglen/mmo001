import { getSellPrice } from '/shared/economy.js';
import { getRarityColor } from '/shared/items.js';
import { capitalizeWord, formatSlotType } from '/shared/itemDisplay.js';
import { isConsumable } from '/shared/consumables.js';

export class VendorPanel {
  constructor(rootEl) {
    this.root = rootEl;
    this.stockEl = rootEl?.querySelector('[data-vendor-stock]');
    this.sellEl = rootEl?.querySelector('[data-vendor-sell]');
    this.goldEl = rootEl?.querySelector('[data-vendor-gold]');
    this.nameEl = rootEl?.querySelector('[data-vendor-name]');
    this.npcId = null;
    this.player = null;
    this.sellListSignature = '';
    this.onBuy = null;
    this.onSell = null;

    rootEl?.querySelector('[data-vendor-close]')?.addEventListener('click', () => this.hide());
    document.getElementById('vendor-backdrop')?.addEventListener('click', () => this.hide());

    // mousedown on panel root — sell rows re-render every world tick; click often misses destroyed buttons
    this.root?.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;

      const buyBtn = e.target.closest('[data-buy]');
      if (buyBtn) {
        e.stopPropagation();
        const key = buyBtn.getAttribute('data-buy');
        if (key && this.npcId) this.onBuy?.(this.npcId, key);
        return;
      }

      const sellBtn = e.target.closest('[data-sell]');
      if (!sellBtn) return;
      e.stopPropagation();
      const index = parseInt(sellBtn.getAttribute('data-sell'), 10);
      if (!Number.isNaN(index) && index >= 0 && this.npcId) {
        this.onSell?.(this.npcId, index);
      }
    });
  }

  isVisible() {
    return this.root && !this.root.classList.contains('hidden');
  }

  open(npc, catalog, player) {
    if (!this.root || !catalog) return;
    this.npcId = npc?.id ?? null;
    this.player = player;
    if (this.nameEl) this.nameEl.textContent = catalog.name ?? 'Vendor';
    this.render(catalog, player);
    this.root.classList.remove('hidden');
    document.getElementById('vendor-backdrop')?.classList.remove('hidden');
  }

  update(player) {
    this.player = player;
    if (this.goldEl && player) this.goldEl.textContent = String(player.gold ?? 0);
    const signature = buildSellListSignature(player);
    if (signature !== this.sellListSignature) {
      this.sellListSignature = signature;
      this.renderSellList(player);
    }
  }

  hide() {
    this.root?.classList.add('hidden');
    document.getElementById('vendor-backdrop')?.classList.add('hidden');
    this.npcId = null;
    this.sellListSignature = '';
  }

  render(catalog, player) {
    if (this.goldEl) this.goldEl.textContent = String(player?.gold ?? 0);

    if (this.stockEl) {
      this.stockEl.innerHTML = (catalog.stock ?? [])
        .map((row) => {
          const typeLabel = getTypeLabel(row);
          return `
        <li class="vendor-row">
          ${buildItemInfoHtml(row.name, row.rarity ?? 'common', typeLabel)}
          <span class="vendor-item-price">${row.price}g</span>
          <button type="button" class="btn-inline" data-buy="${escapeAttr(row.templateKey)}">Buy</button>
        </li>`;
        })
        .join('');
    }

    this.sellListSignature = buildSellListSignature(player);
    this.renderSellList(player);
  }

  renderSellList(player) {
    if (!this.sellEl || !player?.inventory) return;

    const rows = player.inventory
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item && getSellPrice(item) > 0);

    this.sellEl.innerHTML =
      rows.length === 0
        ? '<li class="vendor-empty">No sellable items in bag</li>'
        : rows
            .map(({ item, index }) => {
              const typeLabel = getTypeLabel(item);
              return `
        <li class="vendor-row">
          ${buildItemInfoHtml(item.name, item.rarity ?? 'common', typeLabel)}
          <span class="vendor-item-price">${getSellPrice(item)}g</span>
          <button type="button" class="btn-inline" data-sell="${index}">Sell</button>
        </li>`;
            })
            .join('');
  }
}

function getTypeLabel(item) {
  if (isConsumable(item) || item.type === 'consumable' || item.kind === 'potion') {
    return 'Consumable';
  }
  return formatSlotType(item.slot ?? item.type ?? 'item');
}

function buildItemInfoHtml(name, rarity, typeLabel) {
  const color = getRarityColor(rarity);
  const meta = `${typeLabel} · ${capitalizeWord(rarity)}`;
  return `<div class="vendor-item-info">
    <span class="vendor-item-name" style="color: ${color}">${escapeHtml(name)}</span>
    <span class="vendor-item-meta">${escapeHtml(meta)}</span>
  </div>`;
}

function escapeHtml(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(text) {
  return String(text).replace(/"/g, '&quot;');
}

/** Stable key so sell rows are not rebuilt every world-state tick (breaks button clicks). */
function buildSellListSignature(player) {
  if (!player?.inventory?.length) return '';
  return player.inventory
    .map((item, index) => {
      if (!item || getSellPrice(item) <= 0) return '';
      return `${index}:${item.id ?? item.name}:${item.rarity ?? 'common'}`;
    })
    .filter(Boolean)
    .join('|');
}
