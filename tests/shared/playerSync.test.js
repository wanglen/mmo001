import test from 'node:test';
import assert from 'node:assert/strict';
import {
  toPublicPlayerJSON,
  serializeRemotePlayers,
  applyPlayerMoveIdle,
  PLAYER_MOVE_IDLE_MS,
} from '../../shared/playerSync.js';
import { createPlayerStats } from '../../shared/stats.js';

function makePlayer(overrides = {}) {
  const stats = createPlayerStats(overrides.characterClass ?? 'warrior', overrides.level ?? 3);
  return {
    id: 'p1',
    name: 'Hero',
    characterClass: 'warrior',
    mapId: 'town',
    x: 10,
    y: 20,
    direction: 'down',
    facing: 'down',
    moving: true,
    attacking: false,
    dead: false,
    hp: 80,
    equipment: {},
    townRecallCasting: false,
    lastMoveAt: 0,
    lastAttackAt: 0,
    inventory: new Array(40).fill(null),
    ...stats,
    ...overrides,
  };
}

test('toPublicPlayerJSON omits inventory and quests', () => {
  const player = makePlayer({
    inventory: [{ id: 'potion' }],
    questState: { active: [], completed: [] },
  });

  const json = toPublicPlayerJSON(player, 1000);
  assert.equal(json.id, 'p1');
  assert.equal(json.name, 'Hero');
  assert.equal(json.characterClass, 'warrior');
  assert.equal(json.x, 10);
  assert.equal(json.moving, true);
  assert.equal(json.hp, player.hp);
  assert.ok(json.maxHp > 0);
  assert.equal(json.updatedAt, 1000);
  assert.equal('inventory' in json, false);
  assert.equal('quests' in json, false);
});

test('serializeRemotePlayers excludes viewer and maps public payload', () => {
  const self = makePlayer({ id: 'self' });
  const other = makePlayer({ id: 'other', name: 'Ally', x: 5, y: 6 });

  const remotes = serializeRemotePlayers([self, other], 'self', 2000);

  assert.equal(remotes.length, 1);
  assert.equal(remotes[0].id, 'other');
  assert.equal(remotes[0].name, 'Ally');
  assert.equal(remotes[0].updatedAt, 2000);
});

test('applyPlayerMoveIdle clears stale moving flag', () => {
  const player = makePlayer({ moving: true, lastMoveAt: 1000 });
  const now = 1000 + PLAYER_MOVE_IDLE_MS + 1;

  applyPlayerMoveIdle([player], now);

  assert.equal(player.moving, false);
});

test('applyPlayerMoveIdle keeps recent movers animated', () => {
  const player = makePlayer({ moving: true, lastMoveAt: 5000 });
  const now = 5000 + PLAYER_MOVE_IDLE_MS - 10;

  applyPlayerMoveIdle([player], now);

  assert.equal(player.moving, true);
});
