import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { Writable } from 'stream';
import {
  logGameEvent,
  _setDebugStreamForTests,
  _setThrottleStateForTests,
} from '../../../server/debug/eventLog.js';

describe('eventLog', () => {
  const originalEnv = process.env.DEBUG_EVENTS;

  afterEach(() => {
    process.env.DEBUG_EVENTS = originalEnv;
    _setDebugStreamForTests(null);
    _setThrottleStateForTests(null);
  });

  it('writes JSON lines when DEBUG_EVENTS is enabled', () => {
    process.env.DEBUG_EVENTS = '1';
    const lines = [];
    _setDebugStreamForTests(
      new Writable({
        write(chunk, _enc, cb) {
          lines.push(chunk.toString());
          cb();
        },
      })
    );

    logGameEvent('move_rejected', { reason: 'rate_limit' });
    assert.equal(lines.length, 1);
    const parsed = JSON.parse(lines[0]);
    assert.equal(parsed.source, 'server');
    assert.equal(parsed.type, 'move_rejected');
    assert.equal(parsed.reason, 'rate_limit');
  });

  it('throttes repeated events and reports suppressed count', () => {
    process.env.DEBUG_EVENTS = '1';
    const lines = [];
    _setDebugStreamForTests(
      new Writable({
        write(chunk, _enc, cb) {
          lines.push(chunk.toString());
          cb();
        },
      })
    );

    logGameEvent('move_blocked', { playerId: 'p1' }, { throttleMs: 1000, throttleKey: 'move_blocked:p1' });
    logGameEvent('move_blocked', { playerId: 'p1' }, { throttleMs: 1000, throttleKey: 'move_blocked:p1' });
    logGameEvent('move_blocked', { playerId: 'p1' }, { throttleMs: 1000, throttleKey: 'move_blocked:p1' });

    assert.equal(lines.length, 1);

    _setThrottleStateForTests(
      new Map([['move_blocked:p1', { lastAt: Date.now() - 2000, suppressed: 2 }]])
    );
    logGameEvent('move_blocked', { playerId: 'p1' }, { throttleMs: 1000, throttleKey: 'move_blocked:p1' });
    assert.equal(lines.length, 2);
    const parsed = JSON.parse(lines[1]);
    assert.equal(parsed.suppressed, 2);
  });

  it('tags client-sourced events', () => {
    process.env.DEBUG_EVENTS = '1';
    const lines = [];
    _setDebugStreamForTests(
      new Writable({
        write(chunk, _enc, cb) {
          lines.push(chunk.toString());
          cb();
        },
      })
    );

    logGameEvent('path_failed', { reason: 'no_path' }, { source: 'client' });
    assert.equal(JSON.parse(lines[0]).source, 'client');
  });
});
