import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createEmptyInventory } from '../../shared/inventory.js';
import { createEmptyStash, storeInStash, takeFromStash } from '../../shared/stash.js';
import { createItem, RARITY, resetItemIdCounter } from '../../shared/items.js';
import { createGem, GEM_KIND } from '../../shared/plugins/items/gems.js';

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

  it('storeInStash accepts gems and runes', () => {
    resetItemIdCounter();
    const player = {
      inventory: createEmptyInventory(),
      stash: createEmptyStash(),
    };
    const ruby = createGem(GEM_KIND.RUBY);
    const rune = createGem(GEM_KIND.RUNE);
    player.inventory[0] = ruby;
    player.inventory[1] = rune;

    const rubyResult = storeInStash(player, 0);
    const runeResult = storeInStash(player, 1);

    assert.equal(rubyResult.ok, true);
    assert.equal(runeResult.ok, true);
    assert.equal(player.stash[rubyResult.stashIndex]?.gemKind, GEM_KIND.RUBY);
    assert.equal(player.stash[runeResult.stashIndex]?.gemKind, GEM_KIND.RUNE);
    assert.equal(player.inventory.every((slot) => slot === null), true);
  });

  it('takeFromStash returns gems and runes to the bag', () => {
    const player = {
      inventory: createEmptyInventory(),
      stash: createEmptyStash(),
    };
    const emerald = createGem(GEM_KIND.EMERALD);
    player.stash[3] = emerald;

    const result = takeFromStash(player, 3);

    assert.equal(result.ok, true);
    assert.equal(player.stash[3], null);
    assert.equal(player.inventory[result.inventoryIndex]?.gemKind, GEM_KIND.EMERALD);
  });
});
