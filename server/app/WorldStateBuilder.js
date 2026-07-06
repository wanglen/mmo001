import { loadPlugins } from './loadPlugins.js';
import { composePlayer } from './composePlayer.js';
import { clearAttackAnim } from '../systems/combat.js';
import { clearSkillAnim } from '../systems/skills.js';

/**
 * @param {import('../../shared/plugins/types.js').ServerPlugin[]} plugins
 */
export function createWorldStateBuilder(plugins = loadPlugins()) {
  return {
    /**
     * @param {object} world
     * @param {import('../players/PlayerManager.js').PlayerManager} playerManager
     * @param {string} viewerId
     * @param {{ includeMapTiles?: boolean }} [options]
     */
    build(world, playerManager, viewerId, { includeMapTiles = true } = {}) {
      const now = Date.now();
      const player = playerManager.get(viewerId);
      if (player) {
        clearAttackAnim(player, now);
        clearSkillAnim(player, now);
      }

      /** @type {import('../../shared/plugins/types.js').WorldSerializeContext} */
      const ctx = {
        world,
        playerManager,
        viewerId,
        now,
        includeMapTiles,
        composePlayer: (entry) => composePlayer(entry, now, plugins),
      };

      let state = {};
      for (const plugin of plugins) {
        if (plugin.serializeWorld) {
          Object.assign(state, plugin.serializeWorld(ctx));
        }
      }
      return state;
    },
  };
}

/** Default builder using all loaded plugins. */
let defaultBuilder = createWorldStateBuilder();

export function buildWorldState(world, playerManager, viewerId, options) {
  return defaultBuilder.build(world, playerManager, viewerId, options);
}

/**
 * @param {import('../../shared/plugins/types.js').ServerPlugin[]} plugins
 */
export function setWorldStateBuilderPlugins(plugins) {
  defaultBuilder = createWorldStateBuilder(plugins);
}

export function resetWorldStateBuilderPlugins() {
  defaultBuilder = createWorldStateBuilder(loadPlugins());
}
