import { MAP_LABELS } from '/shared/social.js';
import { CHARACTER_CLASSES } from '/shared/constants.js';

export class SocialPanel {
  constructor(rootEl) {
    this.root = rootEl;
    this.countEl = rootEl?.querySelector('[data-online-count]');
    this.listEl = rootEl?.querySelector('[data-online-list]');
    this.partyEl = rootEl?.querySelector('[data-party-section]');
    this.inviteEl = rootEl?.querySelector('[data-party-invite]');
    this.selfName = null;
    this.selfId = null;
    this.online = { count: 0, players: [] };
    this.onOnlineChange = null;
    this.party = { partyId: null, leaderId: null, members: [], pendingInvite: null };
    this.onInvite = null;
    this.onAcceptInvite = null;
    this.onDeclineInvite = null;
    this.onLeaveParty = null;
    this.onTrade = null;

    this.inviteEl?.querySelector('[data-party-accept]')?.addEventListener('click', () => {
      this.onAcceptInvite?.();
    });
    this.inviteEl?.querySelector('[data-party-decline]')?.addEventListener('click', () => {
      this.onDeclineInvite?.();
    });
    this.partyEl?.querySelector('[data-party-leave]')?.addEventListener('click', () => {
      this.onLeaveParty?.();
    });
  }

  setSelf(player) {
    this.selfName = player?.name ?? null;
    this.selfId = player?.id ?? null;
  }

  updateOnline(payload) {
    if (!payload) return;
    this.online = payload;
    if (this.countEl) this.countEl.textContent = String(payload.count ?? 0);
    this.renderOnlineList();
    this.onOnlineChange?.();
  }

  updateParty(party) {
    if (!party) return;
    this.party = party;
    this.renderParty();
  }

  renderOnlineList() {
    if (!this.listEl) return;

    const rows = (this.online.players ?? []).map((entry) => {
      const isSelf = entry.id === this.selfId;
      const mapLabel = MAP_LABELS[entry.mapId] ?? entry.mapId;
      const classLabel = CHARACTER_CLASSES[entry.characterClass]?.label ?? entry.characterClass;
      const inviteBtn =
        !isSelf && !this.party.partyId && !this.party.pendingInvite
          ? `<button type="button" class="btn-invite" data-invite="${escapeAttr(entry.name)}" title="Invite to party">+</button>`
          : '';
      const tradeBtn = !isSelf
        ? `<button type="button" class="btn-trade" data-trade="${escapeAttr(entry.name)}" title="Trade">⇄</button>`
        : '';

      return `<li class="social-player-row${isSelf ? ' social-player-row--self' : ''}">
        <div class="social-player-info">
          <span class="social-player-name">${escapeHtml(entry.name)}</span>
          <span class="social-player-meta">L${entry.level} ${escapeHtml(classLabel)} · ${escapeHtml(mapLabel)}</span>
        </div>
        ${inviteBtn}
        ${tradeBtn}
      </li>`;
    });

    this.listEl.innerHTML = rows.join('') || '<li class="social-empty">No one online</li>';

    this.listEl.querySelectorAll('[data-invite]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const name = btn.getAttribute('data-invite');
        if (name) this.onInvite?.(name);
      });
    });

    this.listEl.querySelectorAll('[data-trade]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const name = btn.getAttribute('data-trade');
        if (name) this.onTrade?.(name);
      });
    });
  }

  renderParty() {
    if (!this.partyEl || !this.inviteEl) return;

    const { partyId, members, pendingInvite, leaderId } = this.party;

    if (pendingInvite && !partyId) {
      this.inviteEl.classList.remove('hidden');
      this.partyEl.classList.add('hidden');
      const fromEl = this.inviteEl.querySelector('[data-invite-from]');
      if (fromEl) fromEl.textContent = pendingInvite.fromName;
      return;
    }

    this.inviteEl.classList.add('hidden');

    if (!partyId || !members.length) {
      this.partyEl.classList.add('hidden');
      return;
    }

    this.partyEl.classList.remove('hidden');
    const list = this.partyEl.querySelector('[data-party-members]');
    const leaveBtn = this.partyEl.querySelector('[data-party-leave]');

    if (list) {
      list.innerHTML = members
        .map((member) => {
          const leader = member.id === leaderId ? ' ★' : '';
          return `<li>${escapeHtml(member.name)}${leader}</li>`;
        })
        .join('');
    }

    if (leaveBtn) leaveBtn.classList.toggle('hidden', !partyId);
  }

  show() {
    this.root?.classList.remove('hidden');
  }

  hide() {
    this.root?.classList.add('hidden');
  }
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(text) {
  return String(text).replace(/"/g, '&quot;');
}
