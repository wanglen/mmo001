import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateTownMap } from '../../../server/world/worldMapFactory.js';
import { isWalkable } from '../../../server/map/collision.js';
import { VENDOR_ID } from '../../../shared/vendors.js';

describe('townNpcs', () => {
  it('places all NPCs on walkable tiles away from map edges', () => {
    for (let i = 0; i < 5; i++) {
      const town = generateTownMap();
      assert.ok(town.npcs?.length >= 3);

      for (const npc of town.npcs) {
        const tx = Math.floor(npc.x / 32);
        const ty = Math.floor(npc.y / 32);
        assert.ok(tx >= 2 && ty >= 2, `${npc.name} too close to edge (${tx}, ${ty})`);
        assert.ok(tx < town.width - 2 && ty < town.height - 2);
        assert.ok(isWalkable(town, tx, ty), `${npc.name} not on walkable tile`);
      }

      const brok = town.npcs.find((npc) => npc.id === VENDOR_ID.TOWN_MERCHANT);
      assert.ok(brok);
      const brokTileY = Math.floor(brok.y / 32);
      assert.ok(brokTileY >= 4, 'Brok should not spawn against the north edge');
    }
  });
});
