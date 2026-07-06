import { loadPlugins } from './loadPlugins.js';
import { createBroadcastAll } from './worldState.js';
import { onCoreDisconnect } from '../plugins/core/handlers.js';

/**
 * Register all server plugins on a single Socket.IO connection handler.
 *
 * @param {import('socket.io').Server} io
 * @param {object} deps
 * @param {object} deps.world
 * @param {import('../players/PlayerManager.js').PlayerManager} deps.playerManager
 * @param {import('../persistence/CharacterStore.js').CharacterStore} deps.characterStore
 * @param {import('../social/PartyManager.js').PartyManager} deps.partyManager
 * @param {import('../social/TradeManager.js').TradeManager} deps.tradeManager
 */
export function registerHandlerRegistry(io, deps) {
  const { world, playerManager, characterStore, partyManager, tradeManager } = deps;
  const broadcastAll = createBroadcastAll(io, world, playerManager);
  const plugins = loadPlugins();
  const pluginsById = Object.fromEntries(plugins.map((plugin) => [plugin.id, plugin]));

  /** @type {import('../../shared/plugins/types.js').ServerContext} */
  const ctx = {
    io,
    world,
    playerManager,
    characterStore,
    partyManager,
    tradeManager,
    broadcastAll,
    plugins,
    pluginsById,
    disconnectPlayer: async (playerId) => {
      for (const plugin of plugins) {
        if (plugin.id === 'core') continue;
        if (plugin.onDisconnect) {
          await plugin.onDisconnect(playerId, ctx);
        }
      }
      await onCoreDisconnect(playerId, ctx);
    },
    notifyPlayerJoined: (playerId) => {
      const social = pluginsById.social;
      social?.onPlayerJoined?.(playerId, ctx);
    },
  };

  io.on('connection', (socket) => {
    for (const plugin of plugins) {
      plugin.registerServer?.(socket, ctx);
    }

    socket.on('disconnect', () => {
      ctx.disconnectPlayer(socket.id);
    });
  });

  return { broadcastAll, ctx, plugins };
}

/** @deprecated Use registerHandlerRegistry — kept for transitional imports */
export const registerSocketHandlers = registerHandlerRegistry;

export { buildWorldState, createBroadcastAll, broadcastWorldState } from './worldState.js';
