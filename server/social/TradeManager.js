import {
  TRADE_OFFER_SLOTS,
  TRADE_REQUEST_TTL_MS,
  canTradePlayers,
  collectInventoryIndices,
  hasDuplicateIndices,
  normalizeTradeOffer,
  validateTradeProximity,
} from '../../shared/trade.js';
import { addGold, canAffordGold, spendGold } from '../../shared/economy.js';
import { addItemToInventory } from '../../shared/inventory.js';
import { resolveItemIconKey } from '../../shared/itemIcons.js';

let nextTradeId = 1;

export class TradeManager {
  constructor() {
    /** @type {Map<string, { fromId: string, fromName: string, at: number }>} */
    this.pendingByTarget = new Map();
    /** @type {Map<string, string>} */
    this.pendingByRequester = new Map();
    /** @type {Map<string, object>} */
    this.sessions = new Map();
    /** @type {Map<string, string>} */
    this.playerTrade = new Map();
  }

  request(requester, target) {
    this.pruneExpired();
    if (!requester || !target) return { ok: false, reason: 'invalid_target' };
    if (requester.id === target.id) return { ok: false, reason: 'self' };
    if (this.playerTrade.has(requester.id) || this.playerTrade.has(target.id)) {
      return { ok: false, reason: 'in_trade' };
    }
    if (this.pendingByTarget.has(target.id) || this.pendingByRequester.has(requester.id)) {
      return { ok: false, reason: 'pending_exists' };
    }

    const proximity = validateTradeProximity(requester, target);
    if (!proximity.ok) return proximity;

    this.pendingByTarget.set(target.id, {
      fromId: requester.id,
      fromName: requester.name,
      at: Date.now(),
    });
    this.pendingByRequester.set(requester.id, target.id);

    return { ok: true, targetId: target.id };
  }

  accept(player, requester) {
    this.pruneExpired();
    const pending = this.pendingByTarget.get(player.id);
    if (!pending) return { ok: false, reason: 'no_request' };
    if (!requester || requester.id !== pending.fromId) {
      return { ok: false, reason: 'requester_gone' };
    }

    const proximity = validateTradeProximity(requester, player);
    if (!proximity.ok) {
      this.clearPending(requester.id, player.id);
      return proximity;
    }

    this.clearPending(requester.id, player.id);
    return this.startSession(requester.id, player.id, requester, player);
  }

  decline(player) {
    const pending = this.pendingByTarget.get(player.id);
    if (!pending) return { ok: false, reason: 'no_request' };
    this.clearPending(pending.fromId, player.id);
    return { ok: true, fromId: pending.fromId };
  }

  cancelRequest(requesterId) {
    const targetId = this.pendingByRequester.get(requesterId);
    if (!targetId) return { ok: false, reason: 'no_request' };
    this.clearPending(requesterId, targetId);
    return { ok: true, targetId };
  }

  startSession(playerAId, playerBId, playerA, playerB) {
    if (!canTradePlayers(playerA, playerB)) return { ok: false, reason: 'out_of_range' };

    const id = String(nextTradeId++);
    const session = {
      id,
      playerAId,
      playerBId,
      playerA: { id: playerA.id, name: playerA.name },
      playerB: { id: playerB.id, name: playerB.name },
      offerA: normalizeTradeOffer(),
      offerB: normalizeTradeOffer(),
      status: 'open',
    };

    this.sessions.set(id, session);
    this.playerTrade.set(playerAId, id);
    this.playerTrade.set(playerBId, id);

    return { ok: true, tradeId: id, session };
  }

  updateOffer(playerId, offer) {
    const session = this.getSessionForPlayer(playerId);
    if (!session) return { ok: false, reason: 'no_trade' };

    const normalized = normalizeTradeOffer(offer);
    const indices = collectInventoryIndices(normalized);
    if (hasDuplicateIndices(indices)) return { ok: false, reason: 'duplicate_item' };

    if (session.playerAId === playerId) session.offerA = normalized;
    else session.offerB = normalized;

    session.status = 'open';
    session.offerA.ready = false;
    session.offerB.ready = false;

    return { ok: true, session };
  }

  setReady(playerId, ready) {
    const session = this.getSessionForPlayer(playerId);
    if (!session) return { ok: false, reason: 'no_trade' };

    if (session.playerAId === playerId) session.offerA.ready = !!ready;
    else session.offerB.ready = !!ready;

    return { ok: true, session, bothReady: session.offerA.ready && session.offerB.ready };
  }

  executeTrade(session, playerA, playerB) {
    if (!canTradePlayers(playerA, playerB)) return { ok: false, reason: 'out_of_range' };

    const offerA = session.offerA;
    const offerB = session.offerB;
    if (!offerA.ready || !offerB.ready) return { ok: false, reason: 'not_ready' };

    const itemsA = this.resolveOfferItems(playerA, offerA);
    const itemsB = this.resolveOfferItems(playerB, offerB);
    if (!itemsA.ok) return itemsA;
    if (!itemsB.ok) return itemsB;

    if (!canAffordGold(playerA, offerA.gold)) return { ok: false, reason: 'insufficient_gold_a' };
    if (!canAffordGold(playerB, offerB.gold)) return { ok: false, reason: 'insufficient_gold_b' };

    const spaceA = this.countEmptySlots(playerA.inventory) >= itemsB.items.length;
    const spaceB = this.countEmptySlots(playerB.inventory) >= itemsA.items.length;
    if (!spaceA || !spaceB) return { ok: false, reason: 'inventory_full' };

    for (const index of itemsA.indices.sort((a, b) => b - a)) {
      playerA.inventory[index] = null;
    }
    for (const index of itemsB.indices.sort((a, b) => b - a)) {
      playerB.inventory[index] = null;
    }

    spendGold(playerA, offerA.gold);
    spendGold(playerB, offerB.gold);
    addGold(playerA, offerB.gold);
    addGold(playerB, offerA.gold);

    for (const item of itemsB.items) {
      const result = addItemToInventory(playerA.inventory, item);
      if (!result.ok) return { ok: false, reason: 'transfer_failed' };
    }
    for (const item of itemsA.items) {
      const result = addItemToInventory(playerB.inventory, item);
      if (!result.ok) return { ok: false, reason: 'transfer_failed' };
    }

    return { ok: true };
  }

  resolveOfferItems(player, offer) {
    const indices = collectInventoryIndices(offer);
    if (hasDuplicateIndices(indices)) return { ok: false, reason: 'duplicate_item' };

    const items = [];
    for (const index of indices) {
      if (!Number.isInteger(index) || index < 0 || index >= player.inventory.length) {
        return { ok: false, reason: 'invalid_item' };
      }
      const item = player.inventory[index];
      if (!item) return { ok: false, reason: 'missing_item' };
      items.push(item);
    }

    if (indices.length > TRADE_OFFER_SLOTS) return { ok: false, reason: 'too_many_items' };
    return { ok: true, indices, items };
  }

  countEmptySlots(inventory) {
    return inventory.filter((slot) => slot === null).length;
  }

  cancelTrade(playerId) {
    const session = this.getSessionForPlayer(playerId);
    if (!session) return { ok: false, reason: 'no_trade' };
    this.endSession(session.id);
    return { ok: true, partnerIds: [session.playerAId, session.playerBId] };
  }

  getSessionForPlayer(playerId) {
    const tradeId = this.playerTrade.get(playerId);
    return tradeId ? this.sessions.get(tradeId) : null;
  }

  getPendingForPlayer(playerId) {
    this.pruneExpired();
    const pending = this.pendingByTarget.get(playerId);
    if (!pending) return null;
    return { from: { id: pending.fromId, name: pending.fromName } };
  }

  getStateForPlayer(playerId, playerManager) {
    const session = this.getSessionForPlayer(playerId);
    const pending = this.getPendingForPlayer(playerId);
    const outgoingTargetId = this.pendingByRequester.get(playerId);
    const outgoingTarget = outgoingTargetId ? playerManager.get(outgoingTargetId) : null;

    if (session) {
      const isA = session.playerAId === playerId;
      const self = playerManager.get(playerId);
      const partner = playerManager.get(isA ? session.playerBId : session.playerAId);
      return {
        status: session.status,
        tradeId: session.id,
        partner: isA ? session.playerB : session.playerA,
        pendingRequest: null,
        outgoingRequest: null,
        myOffer: this.serializeOffer(isA ? session.offerA : session.offerB, self),
        theirOffer: this.serializeOffer(isA ? session.offerB : session.offerA, partner),
      };
    }

    if (pending) {
      return {
        status: 'pending_incoming',
        tradeId: null,
        partner: pending.from,
        pendingRequest: pending,
        outgoingRequest: null,
        myOffer: normalizeTradeOffer(),
        theirOffer: normalizeTradeOffer(),
      };
    }

    if (outgoingTarget) {
      return {
        status: 'pending_outgoing',
        tradeId: null,
        partner: { id: outgoingTarget.id, name: outgoingTarget.name },
        pendingRequest: null,
        outgoingRequest: { targetId: outgoingTarget.id, targetName: outgoingTarget.name },
        myOffer: normalizeTradeOffer(),
        theirOffer: normalizeTradeOffer(),
      };
    }

    return {
      status: 'idle',
      tradeId: null,
      partner: null,
      pendingRequest: null,
      outgoingRequest: null,
      myOffer: normalizeTradeOffer(),
      theirOffer: normalizeTradeOffer(),
    };
  }

  onDisconnect(playerId) {
    this.cancelRequest(playerId);
    this.pendingByTarget.delete(playerId);
    const session = this.getSessionForPlayer(playerId);
    if (session) this.endSession(session.id);
  }

  endSession(tradeId) {
    const session = this.sessions.get(tradeId);
    if (!session) return;
    this.playerTrade.delete(session.playerAId);
    this.playerTrade.delete(session.playerBId);
    this.sessions.delete(tradeId);
  }

  clearPending(fromId, targetId) {
    this.pendingByTarget.delete(targetId);
    this.pendingByRequester.delete(fromId);
  }

  pruneExpired(now = Date.now()) {
    for (const [targetId, pending] of this.pendingByTarget) {
      if (now - pending.at > TRADE_REQUEST_TTL_MS) {
        this.clearPending(pending.fromId, targetId);
      }
    }
  }

  serializeOffer(offer, player) {
    const normalized = offer ?? normalizeTradeOffer();
    return {
      ...normalized,
      slotItems: normalized.slots.map((slot) => {
        if (!slot) return null;
        const item = player?.inventory?.[slot.inventoryIndex];
        return item
          ? {
              name: item.name,
              iconKey: resolveItemIconKey(item),
              rarity: item.rarity,
              consumableKind: item.consumableKind ?? null,
            }
          : null;
      }),
    };
  }
}
