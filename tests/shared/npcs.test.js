import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createNpc, findNpcAt, NPC_ROLE } from '../../shared/npcs.js';
import { TILE_SIZE } from '../../shared/constants.js';

describe('npcs', () => {
  it('createNpc centers on tile', () => {
    const npc = createNpc({
      id: 'guide',
      name: 'Eldon',
      role: NPC_ROLE.GUIDE,
      tile: { x: 3, y: 4 },
      dialogue: ['Hello'],
    });

    assert.equal(npc.x, 3 * TILE_SIZE + TILE_SIZE / 2);
    assert.equal(npc.y, 4 * TILE_SIZE + TILE_SIZE / 2);
    assert.deepEqual(npc.dialogue, ['Hello']);
  });

  it('findNpcAt returns nearest npc within radius', () => {
    const npcs = [
      createNpc({
        id: 'a',
        name: 'A',
        role: NPC_ROLE.GUIDE,
        tile: { x: 10, y: 10 },
      }),
    ];

    const hit = findNpcAt(npcs, npcs[0].x, npcs[0].y);
    assert.equal(hit?.id, 'a');
    assert.equal(findNpcAt(npcs, 0, 0), null);
  });
});
