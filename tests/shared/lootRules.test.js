import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  LOOT_LOCK_MS,
  getLootEligiblePlayerIds,
  canPickupLoot,
  buildLootDropMeta,
  serializeLootForClient,
  formatPickupMessage,
} from '../../shared/lootRules.js';

describe('lootRules', () => {
  const killer = { id: 'p1', mapId: 'town', x: 100, y: 100 };
  const partyMember = { id: 'p2', mapId: 'town', x: 120, y: 100, dead: false };
  const outsider = { id: 'p3', mapId: 'town', x: 900, y: 100, dead: false };

  it('grants killer-only eligibility without party', () => {
    const ids = getLootEligiblePlayerIds(killer, [killer.id], [killer, partyMember]);
    assert.deepEqual(ids, ['p1']);
  });

  it('includes nearby party members on same map', () => {
    const ids = getLootEligiblePlayerIds(killer, ['p1', 'p2'], [killer, partyMember, outsider]);
    assert.deepEqual(ids.sort(), ['p1', 'p2']);
  });

  it('locks loot until free-for-all timer', () => {
    const now = 1_000_000;
    const drop = {
      eligiblePlayerIds: ['p1'],
      freeForAllAt: now + LOOT_LOCK_MS,
    };
    assert.equal(canPickupLoot(drop, 'p1', now), true);
    assert.equal(canPickupLoot(drop, 'p2', now), false);
    assert.equal(canPickupLoot(drop, 'p2', now + LOOT_LOCK_MS), true);
  });

  it('builds drop meta with lock window', () => {
    const now = 5_000;
    const meta = buildLootDropMeta(killer, ['p1', 'p2'], [killer, partyMember], now);
    assert.equal(meta.killerId, 'p1');
    assert.deepEqual(meta.eligiblePlayerIds.sort(), ['p1', 'p2']);
    assert.equal(meta.freeForAllAt, now + LOOT_LOCK_MS);
  });

  it('serializes pickupLocked for viewers', () => {
    const drop = {
      id: 'loot1',
      x: 10,
      y: 20,
      item: { name: 'Sword' },
      eligiblePlayerIds: ['p1'],
      freeForAllAt: Date.now() + LOOT_LOCK_MS,
    };
    const forKiller = serializeLootForClient(drop, 'p1');
    const forOther = serializeLootForClient(drop, 'p2');
    assert.equal(forKiller.pickupLocked, false);
    assert.equal(forOther.pickupLocked, true);
  });

  it('formatPickupMessage builds a system chat line', () => {
    assert.equal(formatPickupMessage('Rusty Sword'), 'Picked up Rusty Sword');
    assert.equal(formatPickupMessage(''), 'Picked up Item');
  });
});
