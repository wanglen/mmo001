import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { Writable } from 'stream';
import {
  logQuestGeneration,
  isQuestGenLogEnabled,
  _setQuestGenStreamForTests,
} from '../../../server/debug/questGenLog.js';

describe('questGenLog', () => {
  const originalEnv = process.env.QUEST_GEN_LOG;

  afterEach(() => {
    process.env.QUEST_GEN_LOG = originalEnv;
    _setQuestGenStreamForTests(null);
  });

  it('writes JSON lines by default', () => {
    delete process.env.QUEST_GEN_LOG;
    const lines = [];
    _setQuestGenStreamForTests(
      new Writable({
        write(chunk, _enc, cb) {
          lines.push(chunk.toString());
          cb();
        },
      })
    );

    logQuestGeneration({
      ok: true,
      playerName: 'Hero',
      title: 'Bone Patrol',
      fingerprint: 'kill:skeleton:forest',
      durationMs: 420,
    });

    assert.equal(lines.length, 1);
    const parsed = JSON.parse(lines[0]);
    assert.equal(parsed.type, 'quest_generate');
    assert.equal(parsed.ok, true);
    assert.equal(parsed.title, 'Bone Patrol');
    assert.equal(parsed.fingerprint, 'kill:skeleton:forest');
    assert.ok(parsed.at);
  });

  it('can be disabled with QUEST_GEN_LOG=0', () => {
    process.env.QUEST_GEN_LOG = '0';
    assert.equal(isQuestGenLogEnabled(), false);
    const lines = [];
    _setQuestGenStreamForTests(
      new Writable({
        write(chunk, _enc, cb) {
          lines.push(chunk.toString());
          cb();
        },
      })
    );
    logQuestGeneration({ ok: false, reason: 'cooldown' });
    assert.equal(lines.length, 0);
  });
});
