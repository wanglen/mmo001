/**
 * Topological sort for server plugins by `dependsOn`.
 * @param {import('../../shared/plugins/types.js').ServerPlugin[]} plugins
 */
export function sortPlugins(plugins) {
  const byId = new Map(plugins.map((plugin) => [plugin.id, plugin]));
  const sorted = [];
  const visiting = new Set();
  const visited = new Set();

  function visit(id) {
    if (visited.has(id)) return;
    if (visiting.has(id)) {
      throw new Error(`Circular plugin dependency involving "${id}"`);
    }
    const plugin = byId.get(id);
    if (!plugin) {
      throw new Error(`Unknown plugin dependency "${id}"`);
    }

    visiting.add(id);
    for (const dep of plugin.dependsOn ?? []) {
      visit(dep);
    }
    visiting.delete(id);
    visited.add(id);
    sorted.push(plugin);
  }

  for (const plugin of plugins) {
    visit(plugin.id);
  }

  return sorted;
}

/**
 * @param {import('../../shared/plugins/types.js').ServerPlugin[]} plugins
 * @returns {string[]} duplicate event names, if any
 */
export function findDuplicatePluginEvents(plugins) {
  const seen = new Map();
  const duplicates = [];

  for (const plugin of plugins) {
    for (const event of plugin.events ?? []) {
      if (seen.has(event)) {
        duplicates.push(event);
      } else {
        seen.set(event, plugin.id);
      }
    }
  }

  return [...new Set(duplicates)];
}
