import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadPlugins } from '../../../server/app/loadPlugins.js';
import { findDuplicatePluginEvents, sortPlugins } from '../../../server/app/sortPlugins.js';
import { corePlugin } from '../../../server/plugins/core/index.js';
import { combatPlugin } from '../../../server/plugins/combat/index.js';
import { lootPlugin } from '../../../server/plugins/loot/index.js';
import { questsPlugin } from '../../../server/plugins/quests/index.js';
import { socialPlugin } from '../../../server/plugins/social/index.js';
import { economyPlugin } from '../../../server/plugins/economy/index.js';

describe('loadPlugins', () => {
  it('loads all feature plugins', () => {
    const plugins = loadPlugins();
    const ids = plugins.map((plugin) => plugin.id);
    assert.deepEqual(ids, ['core', 'combat', 'loot', 'quests', 'social', 'economy']);
  });

  it('sorts plugins by dependsOn (core before dependents)', () => {
    const shuffled = sortPlugins([economyPlugin, combatPlugin, corePlugin, socialPlugin, lootPlugin, questsPlugin]);
    assert.equal(shuffled[0].id, 'core');
    assert.ok(shuffled.findIndex((p) => p.id === 'loot') < shuffled.findIndex((p) => p.id === 'economy'));
  });

  it('throws on circular dependencies', () => {
    assert.throws(
      () =>
        sortPlugins([
          { id: 'a', dependsOn: ['b'], events: [] },
          { id: 'b', dependsOn: ['a'], events: [] },
        ]),
      /Circular plugin dependency/
    );
  });

  it('registers no duplicate socket event names across plugins', () => {
    const duplicates = findDuplicatePluginEvents(loadPlugins());
    assert.deepEqual(duplicates, [], `duplicate events: ${duplicates.join(', ')}`);
  });

  it('each plugin exposes registerServer', () => {
    for (const plugin of loadPlugins()) {
      assert.equal(typeof plugin.registerServer, 'function', `${plugin.id} missing registerServer`);
    }
  });

  it('feature plugins expose registerBus for domain events', () => {
    for (const plugin of loadPlugins()) {
      if (plugin.id === 'core') continue;
      assert.equal(typeof plugin.registerBus, 'function', `${plugin.id} missing registerBus`);
    }
  });

  it('core plugin serializes world and player slices', () => {
    assert.equal(typeof corePlugin.serializeWorld, 'function');
    assert.equal(typeof corePlugin.serializePlayer, 'function');
  });
});

describe('plugin manifests', () => {
  it('core has no dependencies', () => {
    assert.deepEqual(corePlugin.dependsOn ?? [], []);
  });

  it('economy depends on core and loot', () => {
    assert.deepEqual(economyPlugin.dependsOn, ['core', 'loot']);
  });
});
