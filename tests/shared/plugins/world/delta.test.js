import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyCollectionDelta,
  applyWorldStateDelta,
  computeCollectionDelta,
  indexEntities,
} from '../../../../shared/plugins/world/delta.js';

describe('world delta', () => {
  it('computeCollectionDelta tracks upserts and removals', () => {
    const prev = indexEntities([
      { id: 'a', x: 1 },
      { id: 'b', x: 2 },
    ]);
    const delta = computeCollectionDelta(prev, [
      { id: 'a', x: 1 },
      { id: 'c', x: 3 },
    ]);
    assert.deepEqual(delta.remove, ['b']);
    assert.equal(delta.upsert.length, 1);
    assert.equal(delta.upsert[0].id, 'c');
  });

  it('applyWorldStateDelta replaces entity lists on delta', () => {
    const local = {
      map: { mapId: 'town' },
      monsters: [{ id: 'm1', hp: 10 }],
      loot: [],
      players: [],
    };
    const incoming = {
      sync: { seq: 2, delta: true, tick: 2 },
      monsters: [{ id: 'm2', hp: 8 }],
      loot: [{ id: 'l1', x: 1, y: 2 }],
    };
    const merged = applyWorldStateDelta(local, incoming);
    assert.equal(merged.map.mapId, 'town');
    assert.deepEqual(merged.monsters.map((entry) => entry.id), ['m2']);
    assert.equal(merged.loot[0].id, 'l1');
  });

  it('applyCollectionDelta replaces arrays on full patch', () => {
    const next = applyCollectionDelta([{ id: 'a' }], [{ id: 'b' }]);
    assert.deepEqual(next.map((entry) => entry.id), ['b']);
  });
});
