import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SPAWN_COUNT,
  pickSpawnMonsterType,
  BIOME_SPAWN_WEIGHTS,
  REGULAR_MONSTER_TYPES,
  MONSTER_TYPES,
} from '../../shared/monsters.js';
import { MAP_WIDTH, MAP_HEIGHT } from '../../shared/constants.js';
import { MAP_ID } from '../../shared/worldMaps.js';

describe('monsters spawn count', () => {
  it('SPAWN_COUNT scales with map area vs original 12 on 40×30', () => {
    const expected = Math.round((12 * MAP_WIDTH * MAP_HEIGHT) / (40 * 30));
    assert.equal(SPAWN_COUNT, expected);
    assert.equal(SPAWN_COUNT, 108);
  });
});

describe('biome spawn tables', () => {
  it('defines weights for wilderness, forest, desert, and dungeon', () => {
    assert.ok(BIOME_SPAWN_WEIGHTS[MAP_ID.WILDERNESS].goblin > 0);
    assert.ok(BIOME_SPAWN_WEIGHTS[MAP_ID.WILDERNESS].wolf > 0);
    assert.ok(BIOME_SPAWN_WEIGHTS[MAP_ID.FOREST].wraith > 0);
    assert.ok(BIOME_SPAWN_WEIGHTS[MAP_ID.DESERT].scorpion > 0);
    assert.ok(BIOME_SPAWN_WEIGHTS[MAP_ID.DUNGEON].ghoul > 0);
  });

  it('zone-specific types only appear in their biome weights', () => {
    assert.equal(BIOME_SPAWN_WEIGHTS[MAP_ID.FOREST].scorpion, undefined);
    assert.equal(BIOME_SPAWN_WEIGHTS[MAP_ID.DESERT].wraith, undefined);
    assert.equal(BIOME_SPAWN_WEIGHTS[MAP_ID.WILDERNESS].ghoul, undefined);
    assert.equal(BIOME_SPAWN_WEIGHTS[MAP_ID.WILDERNESS].wraith, undefined);
  });

  it('pickSpawnMonsterType favors biome-appropriate types over many rolls', () => {
    const counts = { skeleton: 0, wraith: 0, goblin: 0, bat: 0 };
    for (let i = 0; i < 500; i++) {
      const type = pickSpawnMonsterType(MAP_ID.FOREST, () => Math.random());
      counts[type] = (counts[type] ?? 0) + 1;
    }
    assert.ok(counts.skeleton + counts.wraith > counts.goblin + counts.bat);
  });

  it('pickSpawnMonsterType falls back to wilderness weights for unknown maps', () => {
    let sawGoblin = false;
    for (let i = 0; i < 50; i++) {
      if (pickSpawnMonsterType('unknown-map', () => 0.01) === 'goblin') sawGoblin = true;
    }
    assert.ok(sawGoblin);
  });

  it('REGULAR_MONSTER_TYPES lists all non-boss monsters', () => {
    assert.ok(REGULAR_MONSTER_TYPES.includes('wolf'));
    assert.ok(REGULAR_MONSTER_TYPES.includes('wraith'));
    assert.ok(REGULAR_MONSTER_TYPES.includes('scorpion'));
    assert.ok(REGULAR_MONSTER_TYPES.includes('ghoul'));
    assert.equal(REGULAR_MONSTER_TYPES.length, Object.keys(MONSTER_TYPES).length - 1);
  });

  it('zone monsters can apply on-hit status effects', () => {
    assert.equal(MONSTER_TYPES.wraith.onHitStatus, 'slow');
    assert.equal(MONSTER_TYPES.scorpion.onHitStatus, 'poison');
    assert.equal(MONSTER_TYPES.wolf.onHitStatus, undefined);
  });
});
