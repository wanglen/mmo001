import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createEmptyInventory } from '../../shared/inventory.js';
import { createEmptyStash, storeInStash, takeFromStash } from '../../shared/stash.js';
import { createItem, RARITY, resetItemIdCounter } from '../../shared/items.js';

describe('stash', () => {
  it('storeInStash moves an item from bag to stash', () => {
    resetItemIdCounter();
    const player = {
      inventory: createEmptyInventory(),
      stash: createEmptyStash(),
    };
    const item = createItem(
      { key: 'rusty_sword', name: 'Rusty Sword', type: 'weapon', slot: 'weapon', baseStats: { str: 2 } },
      RARITY.COMMON
    );
    player.inventory[0] = item;

    const result = storeInStash(player, 0);
    assert.equal(result.ok, true);
    assert.equal(player.inventory[0], null);
    assert.equal(player.stash[result.stashIndex]?.id, item.id);
  });

  it('takeFromStash moves an item into the bag', () => {
    resetItemIdCounter();
    const player = {
      inventory: createEmptyInventory(),
      stash: createEmptyStash(),
    };
    const item = createItem(
      { key: 'rusty_sword', name: 'Rusty Sword', type: 'weapon', slot: 'weapon', baseStats: { str: 2 } },
      RARITY.COMMON
    );
    player.stash[0] = item;

    const result = takeFromStash(player, 0);
    assert.equal(result.ok, true);
    assert.equal(player.stash[0], null);
    assert.equal(player.inventory[result.inventoryIndex]?.id, item.id);
  });
});
