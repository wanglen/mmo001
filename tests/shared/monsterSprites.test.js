import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveMonsterWalkFrame,
  inferMonsterFacing,
  MONSTER_ANIM,
} from '../../shared/monsterSprites.js';

describe('monsterSprites', () => {
  it('resolveMonsterWalkFrame returns idle when not moving', () => {
    assert.equal(resolveMonsterWalkFrame(false, 1), MONSTER_ANIM.IDLE);
  });

  it('resolveMonsterWalkFrame toggles walk column when moving', () => {
    assert.equal(resolveMonsterWalkFrame(true, 0), MONSTER_ANIM.IDLE);
    assert.equal(resolveMonsterWalkFrame(true, 1), MONSTER_ANIM.WALK);
  });

  it('inferMonsterFacing returns down when no prior position', () => {
    assert.equal(inferMonsterFacing(null, null, 10, 10), 'down');
  });

  it('inferMonsterFacing picks dominant axis', () => {
    assert.equal(inferMonsterFacing(0, 0, 5, 0), 'right');
    assert.equal(inferMonsterFacing(5, 0, 0, 0), 'left');
    assert.equal(inferMonsterFacing(0, 0, 0, 4), 'down');
    assert.equal(inferMonsterFacing(0, 5, 0, 0), 'up');
  });

  it('inferMonsterFacing returns down for negligible movement', () => {
    assert.equal(inferMonsterFacing(10, 10, 10.01, 10.01), 'down');
  });
});
