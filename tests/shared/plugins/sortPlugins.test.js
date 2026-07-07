import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sortPlugins } from '../../../shared/plugins/sortPlugins.js';

describe('sortPlugins', () => {
  it('orders plugins by dependsOn', () => {
    const sorted = sortPlugins([
      { id: 'economy', dependsOn: ['core'] },
      { id: 'core', dependsOn: [] },
      { id: 'social', dependsOn: ['core'] },
    ]);
    assert.equal(sorted[0].id, 'core');
    assert.ok(sorted.findIndex((p) => p.id === 'social') > 0);
  });

  it('throws on circular dependencies', () => {
    assert.throws(
      () =>
        sortPlugins([
          { id: 'a', dependsOn: ['b'] },
          { id: 'b', dependsOn: ['a'] },
        ]),
      /Circular plugin dependency/
    );
  });
});
