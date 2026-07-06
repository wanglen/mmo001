import { getSellPrice } from '/shared/economy.js';

export class VendorPanel {
  constructor(rootEl) {
    this.root = rootEl;
    this.stockEl = rootEl?.querySelector('[data-vendor-stock]');
    this.sellEl = rootEl?.querySelector('[data-vendor-sell]');
    this.goldEl = rootEl?.querySelector('[data-vendor-gold]');
    this.nameEl = rootEl?.querySelector('[data-vendor-name]');
    this.npcId = null;
    this.player = null;
    this.onBuy = null;
    this.onSell = null;

    rootEl?.querySelector('[data-vendor-close]')?.addEventListener('click', () => this.hide());
    document.getElementById('vendor-backdrop')?.addEventListener('click', () => this.hide());
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
    this.renderSellList(player);
  }

  hide() {
    this.root?.classList.add('hidden');
    document.getElementById('vendor-backdrop')?.classList.add('hidden');
    this.npcId = null;
  }

  render(catalog, player) {
    if (this.goldEl) this.goldEl.textContent = String(player?.gold ?? 0);

    if (this.stockEl) {
      this.stockEl.innerHTML = (catalog.stock ?? [])
        .map(
          (row) => `
        <li class="vendor-row">
          <span class="vendor-item-name">${escapeHtml(row.name)}</span>
          <span class="vendor-item-price">${row.price}g</span>
          <button type="button" class="btn-inline" data-buy="${escapeAttr(row.templateKey)}">Buy</button>
        </li>`
        )
        .join('');
      this.stockEl.querySelectorAll('[data-buy]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const key = btn.getAttribute('data-buy');
          if (key && this.npcId) this.onBuy?.(this.npcId, key);
        });
      });
    }

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
            .map(
              ({ item, index }) => `
        <li class="vendor-row">
          <span class="vendor-item-name">${escapeHtml(item.name)}</span>
          <span class="vendor-item-price">${getSellPrice(item)}g</span>
          <button type="button" class="btn-inline" data-sell="${index}">Sell</button>
        </li>`
            )
            .join('');

    this.sellEl.querySelectorAll('[data-sell]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const index = Number(btn.getAttribute('data-sell'));
        if (Number.isInteger(index) && this.npcId) this.onSell?.(this.npcId, index);
      });
    });
  }
}

function escapeHtml(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(text) {
  return String(text).replace(/"/g, '&quot;');
}
