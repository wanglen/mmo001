import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { respawnPlayer, syncDeathState } from '../../../server/systems/playerDeath.js';
import { createPlayerStats } from '../../../shared/stats.js';
import { Player } from '../../../server/players/Player.js';
import { createOpenMap } from '../../helpers/fixtures.js';

function createPlayer(overrides = {}) {
  const stats = createPlayerStats('mage');
  const player = new Player({
    id: 'p1',
    name: 'Hero',
    characterClass: 'mage',
    x: 200,
    y: 200,
    stats,
  });
  Object.assign(player, overrides);
  return player;
}

describe('playerDeath', () => {
  const map = { ...createOpenMap(20, 20), spawn: { x: 5, y: 5 } };

  it('syncDeathState marks zero-hp saves as dead', () => {
    const player = createPlayer({ hp: 0, dead: false, moving: true });

    syncDeathState(player);

    assert.equal(player.dead, true);
    assert.equal(player.hp, 0);
    assert.equal(player.moving, false);
  });

  it('respawnPlayer restores hp/mp at spawn', () => {
    const player = createPlayer({ hp: 0, dead: true, x: 400, y: 400 });

    respawnPlayer(player, map);

    assert.equal(player.dead, false);
    assert.equal(player.hp, player.maxHp);
    assert.equal(player.mp, player.maxMp);
    assert.ok(player.x !== 400);
    assert.ok(player.y !== 400);
  });
});
