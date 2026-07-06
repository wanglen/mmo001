import { NPC_INTERACT_RANGE } from './npcs.js';

export const TRADE_RANGE = 80;
export const TRADE_OFFER_SLOTS = 4;
export const TRADE_REQUEST_TTL_MS = 30_000;

export function isWithinTradeRange(x1, y1, x2, y2, range = TRADE_RANGE) {
  return Math.hypot(x2 - x1, y2 - y1) <= range;
}

export function canTradePlayers(a, b) {
  return validateTradeProximity(a, b).ok;
}

/** Check whether two players can initiate or complete a trade. */
export function validateTradeProximity(a, b, range = TRADE_RANGE) {
  if (!a || !b || a.id === b.id) return { ok: false, reason: 'invalid_target' };
  if (a.dead || b.dead) return { ok: false, reason: 'dead' };
  if (a.mapId !== b.mapId) return { ok: false, reason: 'different_map' };
  if (!isWithinTradeRange(a.x, a.y, b.x, b.y, range)) return { ok: false, reason: 'out_of_range' };
  return { ok: true };
}

export function normalizeTradeOffer(offer = {}) {
  const slots = Array.isArray(offer.slots) ? offer.slots.slice(0, TRADE_OFFER_SLOTS) : [];
  while (slots.length < TRADE_OFFER_SLOTS) slots.push(null);

  return {
    gold: Math.max(0, Math.floor(offer.gold ?? 0)),
    slots: slots.map((entry) =>
      Number.isInteger(entry?.inventoryIndex) ? { inventoryIndex: entry.inventoryIndex } : null
    ),
    ready: !!offer.ready,
  };
}

export function collectInventoryIndices(offer) {
  const indices = [];
  for (const slot of offer.slots ?? []) {
    if (slot && Number.isInteger(slot.inventoryIndex)) indices.push(slot.inventoryIndex);
  }
  return indices;
}

export function hasDuplicateIndices(indices) {
  return new Set(indices).size !== indices.length;
}

export function emptyTradeState() {
  return {
    status: 'idle',
    tradeId: null,
    partner: null,
    pendingRequest: null,
    myOffer: normalizeTradeOffer(),
    theirOffer: normalizeTradeOffer(),
  };
}

export function tradeStateForPlayer(playerId, session, pendingIncoming = null) {
  if (!session) {
    if (pendingIncoming) {
      return {
        status: 'pending_incoming',
        tradeId: null,
        partner: pendingIncoming.from,
        pendingRequest: pendingIncoming,
        myOffer: normalizeTradeOffer(),
        theirOffer: normalizeTradeOffer(),
      };
    }
    return emptyTradeState();
  }

  const isA = session.playerAId === playerId;
  return {
    status: session.status,
    tradeId: session.id,
    partner: isA ? session.playerB : session.playerA,
    pendingRequest: null,
    myOffer: isA ? session.offerA : session.offerB,
    theirOffer: isA ? session.offerB : session.offerA,
  };
}

export function isNearEnoughForTrade(a, b, range = TRADE_RANGE) {
  return canTradePlayers(a, b);
}

export { NPC_INTERACT_RANGE };
