import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isAloneOnServer,
  wantsManagementPause,
  shouldPauseGameplay,
} from '../../public/js/game/managementPause.js';

describe('managementPause', () => {
  it('isAloneOnServer uses online count when available', () => {
    assert.equal(isAloneOnServer(1), true);
    assert.equal(isAloneOnServer(2), false);
    assert.equal(isAloneOnServer(0), true);
  });

  it('isAloneOnServer falls back to remote player count', () => {
    assert.equal(isAloneOnServer(undefined, 0), true);
    assert.equal(isAloneOnServer(null, 1), false);
  });

  it('wantsManagementPause when any management UI is open', () => {
    assert.equal(wantsManagementPause({}), false);
    assert.equal(wantsManagementPause({ inventoryVisible: true }), true);
    assert.equal(wantsManagementPause({ stashVisible: true }), true);
    assert.equal(wantsManagementPause({ levelUpVisible: true }), true);
    assert.equal(wantsManagementPause({ skillTreeVisible: true }), true);
  });

  it('shouldPauseGameplay only when alone and a management UI is open', () => {
    assert.equal(shouldPauseGameplay({ wantsPause: true, alone: true }), true);
    assert.equal(shouldPauseGameplay({ wantsPause: true, alone: false }), false);
    assert.equal(shouldPauseGameplay({ wantsPause: false, alone: true }), false);
  });
});
