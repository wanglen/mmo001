import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MONSTER_TYPES } from '../../../../shared/monsters.js';
import { MAP_ID } from '../../../../shared/worldMaps.js';
import {
  averagePlayerLevel,
  resolveMonsterScaleLevel,
  scaleMonsterDefinition,
} from '../../../../shared/plugins/combat/monsterScaling.js';

describe('monsterScaling', () => {
  it('averagePlayerLevel ignores dead players', () => {
    assert.equal(
      averagePlayerLevel([
        { level: 10, dead: false },
        { level: 4, dead: true },
      ]),
      10
    );
    assert.equal(averagePlayerLevel([]), 1);
  });

  it('resolveMonsterScaleLevel adds zone bonus on dungeon maps', () => {
    const wilderness = resolveMonsterScaleLevel(
      { mapId: MAP_ID.WILDERNESS },
      [{ level: 5 }]
    );
    const forest = resolveMonsterScaleLevel({ mapId: MAP_ID.FOREST }, [{ level: 5 }]);
    const desert = resolveMonsterScaleLevel({ mapId: MAP_ID.DESERT }, [{ level: 5 }]);
    const dungeon = resolveMonsterScaleLevel({ mapId: MAP_ID.DUNGEON }, [{ level: 5 }]);
    assert.equal(wilderness, 5);
    assert.equal(forest, 6);
    assert.equal(desert, 7);
    assert.equal(dungeon, 8);
  });

  it('scaleMonsterDefinition increases hp, damage, and xp above level 1', () => {
    const base = MONSTER_TYPES.goblin;
    const scaled = scaleMonsterDefinition(base, 6);
    assert.ok(scaled.hp > base.hp);
    assert.ok(scaled.damage > base.damage);
    assert.ok(scaled.xpReward > base.xpReward);
  });

  it('scaleMonsterDefinition is identity at level 1', () => {
    const base = MONSTER_TYPES.skeleton;
    const scaled = scaleMonsterDefinition(base, 1);
    assert.equal(scaled.hp, base.hp);
    assert.equal(scaled.damage, base.damage);
    assert.equal(scaled.xpReward, base.xpReward);
  });
});
