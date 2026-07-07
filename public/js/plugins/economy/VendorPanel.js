import { getSellPrice } from '/shared/economy.js';
import { Panel } from '../../components/Panel.js';
import { buildItemRowHtml, getItemTypeLabel } from '../../components/ItemRow.js';

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
    const signature = buildSellListSignature(player);
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
            .map(({ item, index }) =>
              buildItemRowHtml({
                name: item.name,
                rarity: item.rarity ?? 'common',
                typeLabel: getItemTypeLabel(item),
                price: getSellPrice(item),
                action: { attr: 'sell', value: index, label: 'Sell' },
              })
            )
            .join('');
  }
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
