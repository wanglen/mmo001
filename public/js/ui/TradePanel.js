import { TRADE_OFFER_SLOTS } from '/shared/trade.js';
import { resolveItemIconKey } from '/shared/itemIcons.js';
import { buildItemIconSvg, getInventoryIconColor } from './itemIcons.js';

export class TradePanel {
  constructor(rootEl) {
    this.root = rootEl;
    this.partnerEl = rootEl?.querySelector('[data-trade-partner]');
    this.statusEl = rootEl?.querySelector('[data-trade-status]');
    this.mySlotsEl = rootEl?.querySelector('[data-trade-my-slots]');
    this.theirSlotsEl = rootEl?.querySelector('[data-trade-their-slots]');
    this.myGoldEl = rootEl?.querySelector('[data-trade-my-gold]');
    this.theirGoldEl = rootEl?.querySelector('[data-trade-their-gold]');
    this.myReadyEl = rootEl?.querySelector('[data-trade-my-ready]');
    this.incomingEl = rootEl?.querySelector('[data-trade-incoming]');
    this.activeEl = rootEl?.querySelector('[data-trade-active]');
    this.state = null;
    this.player = null;
    this.onAccept = null;
    this.onDecline = null;
    this.onCancel = null;
    this.onUpdate = null;
    this.onReady = null;

    rootEl?.querySelector('[data-trade-close]')?.addEventListener('click', () => this.onCancel?.());
    rootEl?.querySelector('[data-trade-accept]')?.addEventListener('click', () => this.onAccept?.());
    rootEl?.querySelector('[data-trade-decline]')?.addEventListener('click', () => this.onDecline?.());
    rootEl?.querySelector('[data-trade-ready]')?.addEventListener('click', () => {
      const next = !this.state?.myOffer?.ready;
      this.onReady?.(next);
    });
    this.myGoldEl?.addEventListener('change', () => this.emitUpdate());
  }

  isVisible() {
    return this.root && !this.root.classList.contains('hidden');
  }

  update(state, player) {
    this.state = state;
    this.player = player;
    if (!state || state.status === 'idle') {
      this.hide();
      return;
    }

    this.root?.classList.remove('hidden');
    document.getElementById('trade-backdrop')?.classList.remove('hidden');

    const incoming = state.status === 'pending_incoming';
    this.incomingEl?.classList.toggle('hidden', !incoming);
    this.activeEl?.classList.toggle('hidden', incoming);

    if (this.partnerEl) {
      this.partnerEl.textContent = state.partner?.name ?? 'Player';
    }
    if (this.statusEl) {
      this.statusEl.textContent =
        state.status === 'pending_outgoing'
          ? 'Waiting for partner…'
          : state.status === 'pending_incoming'
            ? 'Trade request'
            : state.myOffer?.ready && state.theirOffer?.ready
              ? 'Completing…'
              : 'Offer items and gold, then mark ready';
    }

    if (!incoming) {
      this.renderOffers(state, player);
    }
  }

  renderOffers(state, player) {
    if (this.myGoldEl && document.activeElement !== this.myGoldEl) {
      this.myGoldEl.value = String(state.myOffer?.gold ?? 0);
    }
    if (this.theirGoldEl) this.theirGoldEl.textContent = String(state.theirOffer?.gold ?? 0);
    if (this.myReadyEl) this.myReadyEl.textContent = state.myOffer?.ready ? 'Unready' : 'Ready';

    if (this.mySlotsEl) {
      this.mySlotsEl.innerHTML = this.renderSlotPickers(state.myOffer?.slots ?? [], player);
      this.mySlotsEl.querySelectorAll('select').forEach((select) => {
        select.addEventListener('change', () => {
          this.updateSlotIcon(select, player);
          this.emitUpdate();
        });
      });
    }

    if (this.theirSlotsEl) {
      this.theirSlotsEl.innerHTML = (state.theirOffer?.slotItems ?? [])
        .map((entry) => this.renderReadonlySlot(entry))
        .join('');
    }
  }

  renderReadonlySlot(entry) {
    if (!entry?.name) {
      return `<div class="trade-slot trade-slot--readonly trade-slot--empty">—</div>`;
    }

    const iconKey = entry.iconKey ?? resolveItemIconKey(entry);
    const color = getInventoryIconColor(entry);
    return `<div class="trade-slot trade-slot--readonly">
      <span class="trade-slot-icon" style="color: ${color}">${buildItemIconSvg(iconKey)}</span>
      <span class="trade-slot-name">${escapeHtml(entry.name)}</span>
    </div>`;
  }

  renderSlotPickers(slots, player) {
    const options = ['<option value="">— empty —</option>'];
    (player?.inventory ?? []).forEach((item, index) => {
      if (item) options.push(`<option value="${index}">${escapeHtml(item.name)}</option>`);
    });

    return Array.from({ length: TRADE_OFFER_SLOTS }, (_, i) => {
      const selected = slots[i]?.inventoryIndex;
      const selectedItem =
        Number.isInteger(selected) && player?.inventory ? player.inventory[selected] : null;
      const opts = options
        .map((opt) => {
          if (!opt.includes('value=')) return opt;
          const val = opt.match(/value="([^"]*)"/)?.[1];
          const sel = String(selected) === val ? ' selected' : '';
          return opt.replace('<option', `<option${sel}`);
        })
        .join('');

      return `<div class="trade-slot-row">
        ${buildTradeIconHtml(selectedItem)}
        <select class="trade-slot-select" data-slot="${i}">${opts}</select>
      </div>`;
    }).join('');
  }

  updateSlotIcon(select, player = this.player) {
    const row = select.closest('.trade-slot-row');
    if (!row) return;

    const val = select.value;
    const item = val === '' ? null : player?.inventory?.[Number(val)] ?? null;
    const iconEl = row.querySelector('.trade-slot-icon');
    if (iconEl) {
      iconEl.outerHTML = buildTradeIconHtml(item);
    }
  }

  emitUpdate() {
    if (!this.state || this.state.status !== 'open') return;
    const gold = Math.max(0, Math.floor(Number(this.myGoldEl?.value ?? 0)));
    const slots = [];
    this.mySlotsEl?.querySelectorAll('select').forEach((select) => {
      const val = select.value;
      slots.push(val === '' ? null : { inventoryIndex: Number(val) });
    });
    while (slots.length < TRADE_OFFER_SLOTS) slots.push(null);
    this.onUpdate?.({ gold, slots });
  }

  hide() {
    this.root?.classList.add('hidden');
    document.getElementById('trade-backdrop')?.classList.add('hidden');
  }
}

function buildTradeIconHtml(item) {
  if (!item) {
    return '<span class="trade-slot-icon trade-slot-icon--empty" aria-hidden="true">—</span>';
  }

  const iconKey = resolveItemIconKey(item);
  const color = getInventoryIconColor(item);
  return `<span class="trade-slot-icon" style="color: ${color}">${buildItemIconSvg(iconKey)}</span>`;
}

function escapeHtml(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
