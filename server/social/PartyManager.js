import { PARTY_MAX_SIZE, PARTY_INVITE_TTL_MS } from '../../shared/social.js';

let nextPartyId = 1;

export class PartyManager {
  constructor() {
    /** @type {Map<string, { id: string, leaderId: string, members: Set<string> }>} */
    this.parties = new Map();
    /** @type {Map<string, string>} */
    this.memberToParty = new Map();
    /** @type {Map<string, { partyId: string, fromId: string, fromName: string, at: number }>} */
    this.pendingInvites = new Map();
  }

  invite(inviter, target) {
    if (!inviter || !target) return { ok: false, reason: 'invalid_target' };
    if (inviter.id === target.id) return { ok: false, reason: 'self' };
    if (this.memberToParty.has(target.id)) return { ok: false, reason: 'target_in_party' };
    if (this.pendingInvites.has(target.id)) return { ok: false, reason: 'already_invited' };

    let partyId = this.memberToParty.get(inviter.id);
    if (!partyId) {
      partyId = String(nextPartyId++);
      this.parties.set(partyId, {
        id: partyId,
        leaderId: inviter.id,
        members: new Set([inviter.id]),
      });
      this.memberToParty.set(inviter.id, partyId);
    }

    const party = this.parties.get(partyId);
    if (!party?.members.has(inviter.id)) return { ok: false, reason: 'not_in_party' };
    if (party.leaderId !== inviter.id) return { ok: false, reason: 'not_leader' };
    if (party.members.size >= PARTY_MAX_SIZE) return { ok: false, reason: 'party_full' };

    this.pendingInvites.set(target.id, {
      partyId,
      fromId: inviter.id,
      fromName: inviter.name,
      at: Date.now(),
    });

    return { ok: true, partyId, targetId: target.id };
  }

  accept(player) {
    this.pruneExpiredInvites();
    const invite = this.pendingInvites.get(player.id);
    if (!invite) return { ok: false, reason: 'no_invite' };
    if (this.memberToParty.has(player.id)) return { ok: false, reason: 'already_in_party' };

    const party = this.parties.get(invite.partyId);
    if (!party || party.members.size >= PARTY_MAX_SIZE) {
      this.pendingInvites.delete(player.id);
      return { ok: false, reason: 'party_gone' };
    }

    this.pendingInvites.delete(player.id);
    party.members.add(player.id);
    this.memberToParty.set(player.id, party.id);

    return { ok: true, partyId: party.id, memberIds: [...party.members] };
  }

  decline(player) {
    if (!this.pendingInvites.has(player.id)) return { ok: false, reason: 'no_invite' };
    this.pendingInvites.delete(player.id);
    return { ok: true };
  }

  leave(player) {
    const partyId = this.memberToParty.get(player.id);
    if (!partyId) return { ok: false, reason: 'not_in_party' };
    this._removeMember(player.id, partyId);
    return { ok: true, partyId };
  }

  onDisconnect(playerId) {
    this.pendingInvites.delete(playerId);
    for (const [targetId, invite] of this.pendingInvites) {
      if (invite.fromId === playerId) this.pendingInvites.delete(targetId);
    }
    const partyId = this.memberToParty.get(playerId);
    if (partyId) this._removeMember(playerId, partyId);
  }

  getMemberIds(playerId) {
    const partyId = this.memberToParty.get(playerId);
    if (!partyId) return [playerId];
    const party = this.parties.get(partyId);
    return party ? [...party.members] : [playerId];
  }

  getPartyStateForPlayer(playerId, playerManager) {
    this.pruneExpiredInvites();

    const partyId = this.memberToParty.get(playerId);
    if (partyId) {
      const party = this.parties.get(partyId);
      if (!party) {
        this.memberToParty.delete(playerId);
        return emptyPartyState();
      }

      const members = [...party.members]
        .map((id) => {
          const entry = playerManager.get(id);
          return entry
            ? {
                id,
                name: entry.name,
                characterClass: entry.characterClass,
                level: entry.level ?? 1,
                mapId: entry.mapId,
              }
            : null;
        })
        .filter(Boolean);

      return {
        partyId,
        leaderId: party.leaderId,
        members,
        pendingInvite: null,
      };
    }

    const invite = this.pendingInvites.get(playerId);
    if (invite) {
      return {
        partyId: null,
        leaderId: null,
        members: [],
        pendingInvite: {
          fromId: invite.fromId,
          fromName: invite.fromName,
          partyId: invite.partyId,
        },
      };
    }

    return emptyPartyState();
  }

  getAffectedPlayerIds(playerId) {
    const ids = new Set([playerId]);
    const partyId = this.memberToParty.get(playerId);
    if (partyId) {
      for (const memberId of this.parties.get(partyId)?.members ?? []) {
        ids.add(memberId);
      }
    }
    const invite = this.pendingInvites.get(playerId);
    if (invite) {
      ids.add(invite.fromId);
      for (const memberId of this.parties.get(invite.partyId)?.members ?? []) {
        ids.add(memberId);
      }
    }
    return [...ids];
  }

  pruneExpiredInvites(now = Date.now()) {
    for (const [targetId, invite] of this.pendingInvites) {
      if (now - invite.at > PARTY_INVITE_TTL_MS) {
        this.pendingInvites.delete(targetId);
      }
    }
  }

  _removeMember(playerId, partyId) {
    const party = this.parties.get(partyId);
    if (!party) return;

    party.members.delete(playerId);
    this.memberToParty.delete(playerId);

    if (party.members.size === 0) {
      this.parties.delete(partyId);
      return;
    }

    if (party.leaderId === playerId) {
      party.leaderId = [...party.members][0];
    }
  }
}

function emptyPartyState() {
  return { partyId: null, leaderId: null, members: [], pendingInvite: null };
}
