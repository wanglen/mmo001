/**
 * @typedef {import('../events.js').EVENTS} EventMap
 */

/**
 * Server-side plugin manifest (Phase A — handler registration only).
 *
 * @typedef {object} ServerPlugin
 * @property {string} id — unique plugin id (e.g. 'combat')
 * @property {string[]} [dependsOn] — ids that must register before this plugin
 * @property {string[]} [events] — socket events registered (for duplicate detection in tests)
 * @property {(socket: import('socket.io').Socket, ctx: ServerContext) => void} [registerServer]
 * @property {(playerId: string, ctx: ServerContext) => void | Promise<void>} [onDisconnect]
 * @property {(playerId: string, ctx: ServerContext) => void} [onPlayerJoined]
 */

/**
 * @typedef {object} ServerContext
 * @property {import('socket.io').Server} io
 * @property {object} world
 * @property {import('../../server/players/PlayerManager.js').PlayerManager} playerManager
 * @property {import('../../server/persistence/CharacterStore.js').CharacterStore} characterStore
 * @property {import('../../server/social/PartyManager.js').PartyManager} partyManager
 * @property {import('../../server/social/TradeManager.js').TradeManager} tradeManager
 * @property {(options?: { teleportedIds?: Set<string> | null }) => void} broadcastAll
 * @property {ServerPlugin[]} plugins
 * @property {Record<string, ServerPlugin>} pluginsById
 * @property {(playerId: string) => Promise<void>} disconnectPlayer
 * @property {(playerId: string) => Promise<void>} evictSession
 * @property {(playerId: string) => void} notifyPlayerJoined
 */

export {};
