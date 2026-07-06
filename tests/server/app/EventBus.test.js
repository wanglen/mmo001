import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createEventBus } from '../../../server/app/EventBus.js';

describe('EventBus', () => {
  it('calls handlers on emit', () => {
    const bus = createEventBus();
    const calls = [];

    bus.on('test:event', (payload) => {
      calls.push(payload);
    });

    bus.emit('test:event', { value: 1 });
    assert.deepEqual(calls, [{ value: 1 }]);
  });

  it('supports multiple listeners and unsubscribe', () => {
    const bus = createEventBus();
    let count = 0;

    const off = bus.on('count', () => {
      count += 1;
    });
    bus.on('count', () => {
      count += 10;
    });

    bus.emit('count');
    assert.equal(count, 11);

    off();
    bus.emit('count');
    assert.equal(count, 21);
  });

  it('tracks listenerCount and clears handlers', () => {
    const bus = createEventBus();
    bus.on('a', () => {});
    bus.on('a', () => {});

    assert.equal(bus.listenerCount('a'), 2);
    assert.equal(bus.listenerCount('missing'), 0);

    bus.clear();
    assert.equal(bus.listenerCount('a'), 0);
  });
});
