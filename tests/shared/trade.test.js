import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  TRADE_OFFER_SLOTS,
  canTradePlayers,
  normalizeTradeOffer,
  collectInventoryIndices,
  hasDuplicateIndices,
  validateTradeProximity,
} from '../../shared/trade.js';

describe('trade', () => {
  const playerA = { id: 'a', mapId: 'town', x: 100, y: 100, dead: false };
  const playerB = { id: 'b', mapId: 'town', x: 130, y: 100, dead: false };
  const far = { id: 'c', mapId: 'town', x: 500, y: 100, dead: false };

  it('allows trade when players are in range on same map', () => {
    assert.equal(canTradePlayers(playerA, playerB), true);
    assert.equal(canTradePlayers(playerA, far), false);
    assert.equal(canTradePlayers(playerA, { ...playerB, mapId: 'dungeon' }), false);
  });

  it('normalizes offer slots and gold', () => {
    const offer = normalizeTradeOffer({
      gold: 12.7,
      slots: [{ inventoryIndex: 1 }, null, { inventoryIndex: 3 }],
      ready: true,
    });
    assert.equal(offer.gold, 12);
    assert.equal(offer.slots.length, TRADE_OFFER_SLOTS);
    assert.equal(offer.slots[0].inventoryIndex, 1);
    assert.equal(offer.slots[1], null);
    assert.equal(offer.ready, true);
  });

  it('detects duplicate inventory indices', () => {
    const offer = normalizeTradeOffer({
      slots: [{ inventoryIndex: 0 }, { inventoryIndex: 0 }],
    });
    const indices = collectInventoryIndices(offer);
    assert.equal(hasDuplicateIndices(indices), true);
  });

  it('validateTradeProximity rejects different maps and distance', () => {
    const a = { id: 'a', mapId: 'town', x: 100, y: 100, dead: false };
    const b = { id: 'b', mapId: 'dungeon', x: 100, y: 100, dead: false };
    assert.equal(validateTradeProximity(a, b).reason, 'different_map');

    const near = { id: 'c', mapId: 'town', x: 120, y: 100, dead: false };
    assert.equal(validateTradeProximity(a, near).ok, true);

    const far = { id: 'd', mapId: 'town', x: 900, y: 100, dead: false };
    assert.equal(validateTradeProximity(a, far).reason, 'out_of_range');
  });
});
