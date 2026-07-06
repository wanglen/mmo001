import { loadPlugins } from './loadPlugins.js';

let cachedPlugins = null;

function getDefaultPlugins() {
  if (!cachedPlugins) {
    cachedPlugins = loadPlugins();
  }
  return cachedPlugins;
}

/**
 * Merge per-plugin player slices into one client payload.
 *
 * @param {import('../players/Player.js').Player} player
 * @param {number} [now]
 * @param {import('../../shared/plugins/types.js').ServerPlugin[]} [plugins]
 */
export function composePlayer(player, now = Date.now(), plugins = getDefaultPlugins()) {
  if (!player) return null;

  let payload = {};
  for (const plugin of plugins) {
    if (plugin.serializePlayer) {
      Object.assign(payload, plugin.serializePlayer(player, now));
    }
  }
  return payload;
}

/** @param {import('../../shared/plugins/types.js').ServerPlugin[]} plugins */
export function setComposePlayerPlugins(plugins) {
  cachedPlugins = plugins;
}

export function resetComposePlayerPlugins() {
  cachedPlugins = null;
}
