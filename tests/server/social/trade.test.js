import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TradeManager } from '../../../server/social/TradeManager.js';

function mockPlayer(id, name, x = 100, y = 100, mapId = 'town') {
  return {
    id,
    name,
    x,
    y,
    mapId,
    dead: false,
    inventory: Array(20).fill(null),
    gold: 0,
  };
}

describe('TradeManager.request', () => {
  it('rejects trade request when players are far apart', () => {
    const tradeManager = new TradeManager();
    const requester = mockPlayer('a', 'Alice', 100, 100);
    const target = mockPlayer('b', 'Bob', 900, 900);

    const result = tradeManager.request(requester, target);
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'out_of_range');
  });

  it('allows trade request when players are in range', () => {
    const tradeManager = new TradeManager();
    const requester = mockPlayer('a', 'Alice', 100, 100);
    const target = mockPlayer('b', 'Bob', 120, 100);

    const result = tradeManager.request(requester, target);
    assert.equal(result.ok, true);
  });
});

describe('TradeManager.accept', () => {
  it('requires players in range to open trade', () => {
    const tradeManager = new TradeManager();
    const requester = mockPlayer('a', 'Alice', 100, 100);
    const target = mockPlayer('b', 'Bob', 120, 100);

    tradeManager.request(requester, target);
    target.x = 900;
    const result = tradeManager.accept(target, requester);
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'out_of_range');
  });

  it('opens trade when players are in range', () => {
    const tradeManager = new TradeManager();
    const requester = mockPlayer('a', 'Alice', 100, 100);
    const target = mockPlayer('b', 'Bob', 120, 100);

    tradeManager.request(requester, target);
    const result = tradeManager.accept(target, requester);
    assert.equal(result.ok, true);
    assert.ok(result.session);
  });
});
