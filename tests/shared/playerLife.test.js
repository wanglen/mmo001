import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyPlayerDamage, isPlayerAlive } from '../../shared/playerLife.js';

describe('playerLife', () => {
  it('isPlayerAlive requires hp > 0 and not dead', () => {
    assert.equal(isPlayerAlive({ hp: 10, dead: false }), true);
    assert.equal(isPlayerAlive({ hp: 0, dead: false }), false);
    assert.equal(isPlayerAlive({ hp: 10, dead: true }), false);
  });

  it('applyPlayerDamage kills player at zero hp', () => {
    const player = { hp: 5, dead: false, moving: true, attacking: true };

    const result = applyPlayerDamage(player, 5, 1000);

    assert.equal(result.killed, true);
    assert.equal(player.hp, 0);
    assert.equal(player.dead, true);
    assert.equal(player.moving, false);
    assert.equal(player.attacking, false);
    assert.equal(player.lastDamagedAt, 1000);
  });

  it('applyPlayerDamage leaves living player active', () => {
    const player = { hp: 20, dead: false, moving: true };

    const result = applyPlayerDamage(player, 8, 500);

    assert.equal(result.killed, false);
    assert.equal(player.hp, 12);
    assert.equal(player.dead, false);
    assert.equal(player.moving, true);
  });
});
