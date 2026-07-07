import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RARITY } from '../../../../shared/items.js';
import { createGem } from '../../../../shared/plugins/items/gems.js';
import {
  rollSocketCount,
  createEmptySockets,
  socketGemIntoItem,
  getSocketStatBonuses,
} from '../../../../shared/plugins/items/sockets.js';

describe('sockets', () => {
  it('rollSocketCount increases with rarity', () => {
    assert.equal(rollSocketCount(RARITY.COMMON, () => 0), 0);
    assert.ok(rollSocketCount(RARITY.RARE, () => 0) >= 1);
  });

  it('socketGemIntoItem fills the first empty socket', () => {
    const item = { sockets: createEmptySockets(2) };
    const gem = createGem('ruby');
    const result = socketGemIntoItem(item, gem);
    assert.equal(result.ok, true);
    assert.equal(item.sockets[0].gem.name, 'Ruby');
    assert.equal(getSocketStatBonuses(item.sockets).str, 3);
  });
});
