import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createGem } from '../../../../shared/plugins/items/gems.js';
import { createEmptySockets } from '../../../../shared/plugins/items/sockets.js';
import { listSocketTargets } from '../../../../shared/plugins/items/socketUi.js';

describe('socketUi', () => {
  it('listSocketTargets includes empty socket and replace actions', () => {
    const ruby = createGem('ruby');
    const player = {
      inventory: [
        {
          name: 'Rare Sword',
          sockets: [{ gem: { ...ruby, stats: { ...ruby.stats } } }, ...createEmptySockets(1)],
        },
      ],
      equipment: {},
    };

    const targets = listSocketTargets(player);

    assert.equal(targets.length, 2);
    assert.deepEqual(
      targets.map((target) => [target.replace, target.socketIndex, target.label]),
      [
        [false, null, 'Rare Sword'],
        [true, 0, 'Rare Sword'],
      ]
    );
    assert.equal(targets[1].occupiedGemName, 'Ruby');
  });
});
