import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createGem } from '../../../../shared/plugins/items/gems.js';
import { createEmptySockets } from '../../../../shared/plugins/items/sockets.js';
import { createEmptyInventory, createEmptyEquipment } from '../../../../shared/inventory.js';
import { socketGem } from '../../../../server/plugins/loot/advancedItems.js';

describe('advancedItems socketGem', () => {
  it('returns replaced gem to the source inventory slot', () => {
    const ruby = createGem('ruby');
    const sapphire = createGem('sapphire');
    const player = {
      inventory: [sapphire, { name: 'Rare Sword', sockets: [{ gem: { ...ruby, stats: { ...ruby.stats } } }] }],
      equipment: createEmptyEquipment(),
    };

    const result = socketGem(player, {
      gemInventoryIndex: 0,
      targetInventoryIndex: 1,
      socketIndex: 0,
    });

    assert.equal(result.ok, true);
    assert.equal(result.replaced, true);
    assert.equal(player.inventory[0]?.name, 'Ruby');
    assert.equal(player.inventory[1]?.sockets[0]?.gem?.name, 'Sapphire');
  });
});
