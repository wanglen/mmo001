import { loadPlugins } from './loadPlugins.js';
import { createBroadcastAll } from './worldState.js';
import { createEventBus } from './EventBus.js';
import { DOMAIN_EVENTS } from '../../shared/plugins/domainEvents.js';
import { onCoreDisconnect } from '../plugins/core/handlers.js';
import { broadcastOnlinePlayers } from '../plugins/social/index.js';
import { WorldStateSyncManager } from './WorldStateSync.js';

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
  const eventBus = createEventBus();
  const worldStateSync = new WorldStateSyncManager();
  const broadcastAll = createBroadcastAll(io, world, playerManager, worldStateSync);
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
    eventBus,
    plugins,
    pluginsById,
    disconnectPlayer: async (playerId) => {
      worldStateSync.clear(playerId);
      eventBus.emit(DOMAIN_EVENTS.PLAYER_DISCONNECT, { playerId, ctx });
      await onCoreDisconnect(playerId, ctx);
      broadcastOnlinePlayers(io, playerManager);
    },
    notifyPlayerJoined: (playerId) => {
      const social = pluginsById.social;
      social?.onPlayerJoined?.(playerId, ctx);
    },
  };

  for (const plugin of plugins) {
    plugin.registerBus?.(eventBus, ctx);
  }

  io.on('connection', (socket) => {
    for (const plugin of plugins) {
      plugin.registerServer?.(socket, ctx);
    }

    socket.on('disconnect', () => {
      ctx.disconnectPlayer(socket.id);
    });
  });

  return { broadcastAll, ctx, plugins, eventBus };
}

/** @deprecated Use registerHandlerRegistry — kept for transitional imports */
export const registerSocketHandlers = registerHandlerRegistry;

export { buildWorldState, createBroadcastAll, broadcastWorldState } from './worldState.js';
export { createWorldStateBuilder } from './WorldStateBuilder.js';
export { composePlayer } from './composePlayer.js';
export { createEventBus } from './EventBus.js';
