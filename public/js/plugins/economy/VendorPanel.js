import { buildVendorSellRows, buildVendorSellSignature } from '/shared/vendorSell.js';
import { Panel } from '../../components/Panel.js';
import {
  buildItemRowHtml,
  buildItemInfoHtml,
  getItemTypeLabel,
  escapeHtml,
  escapeAttr,
} from '../../components/ItemRow.js';

export class VendorPanel extends Panel {
  constructor(rootEl) {
    super(rootEl, { backdropId: 'vendor-backdrop' });
    this.stockEl = rootEl?.querySelector('[data-vendor-stock]');
    this.sellEl = rootEl?.querySelector('[data-vendor-sell]');
    this.goldEl = rootEl?.querySelector('[data-vendor-gold]');
    this.nameEl = rootEl?.querySelector('[data-vendor-name]');
    this.npcId = null;
    this.player = null;
    this.sellListSignature = '';
    this.onBuy = null;
    this.onSell = null;
    this.onSellPotions = null;

    rootEl?.querySelector('[data-vendor-close]')?.addEventListener('click', () => this.hide());
    this.backdropEl?.addEventListener('click', () => this.hide());

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

      const sellPotionBtn = e.target.closest('[data-sell-potion]');
      if (sellPotionBtn) {
        e.stopPropagation();
        const templateKey = sellPotionBtn.getAttribute('data-sell-potion');
        const rarity = sellPotionBtn.getAttribute('data-sell-rarity') ?? 'common';
        const qtyInput = sellPotionBtn.closest('.vendor-row')?.querySelector('.vendor-qty-input');
        const quantity = parseInt(qtyInput?.value ?? '1', 10);
        if (templateKey && !Number.isNaN(quantity) && quantity > 0 && this.npcId) {
          this.onSellPotions?.(this.npcId, templateKey, rarity, quantity);
        }
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

  open(npc, catalog, player) {
    if (!this.root || !catalog) return;
    this.npcId = npc?.id ?? null;
    this.player = player;
    if (this.nameEl) this.nameEl.textContent = catalog.name ?? 'Vendor';
    this.render(catalog, player);
    this.show();
  }

  update(player) {
    this.player = player;
    if (this.goldEl && player) this.goldEl.textContent = String(player.gold ?? 0);
    const signature = buildVendorSellSignature(player?.inventory ?? []);
    if (signature !== this.sellListSignature) {
      this.sellListSignature = signature;
      this.renderSellList(player);
    }
  }

  hide() {
    super.hide();
    this.npcId = null;
    this.sellListSignature = '';
  }

  render(catalog, player) {
    if (this.goldEl) this.goldEl.textContent = String(player?.gold ?? 0);

    if (this.stockEl) {
      this.stockEl.innerHTML = (catalog.stock ?? [])
        .map((row) =>
          buildItemRowHtml({
            name: row.name,
            rarity: row.rarity ?? 'common',
            typeLabel: getItemTypeLabel(row),
            price: row.price,
            action: { attr: 'buy', value: row.templateKey, label: 'Buy' },
          })
        )
        .join('');
    }

    this.sellListSignature = buildVendorSellSignature(player?.inventory ?? []);
    this.renderSellList(player);
  }

  renderSellList(player) {
    if (!this.sellEl || !player?.inventory) return;

    const rows = buildVendorSellRows(player.inventory);

    this.sellEl.innerHTML =
      rows.length === 0
        ? '<li class="vendor-empty">No sellable items in bag</li>'
        : rows
            .map((row) =>
              row.kind === 'potion_stack' ? buildPotionSellRowHtml(row) : buildGearSellRowHtml(row)
            )
            .join('');
  }
}

function buildGearSellRowHtml(row) {
  const { item, index, unitPrice } = row;
  return buildItemRowHtml({
    name: item.name,
    rarity: item.rarity ?? 'common',
    typeLabel: getItemTypeLabel(item),
    price: unitPrice,
    action: { attr: 'sell', value: index, label: 'Sell' },
  });
}

function buildPotionSellRowHtml(row) {
  const label = `${row.name} ×${row.totalCount}`;
  return `<li class="vendor-row vendor-row--stack">
    ${buildItemInfoHtml(label, row.rarity, 'Consumable')}
    <span class="vendor-item-price">${escapeHtml(String(row.unitPrice))}g ea</span>
    <div class="vendor-sell-qty">
      <input
        type="number"
        class="vendor-qty-input"
        min="1"
        max="${row.totalCount}"
        value="1"
        aria-label="Quantity to sell"
      >
      <button type="button" class="btn-inline" data-sell-potion="${escapeAttr(row.templateKey)}" data-sell-rarity="${escapeAttr(row.rarity)}">Sell</button>
    </div>
  </li>`;
}
