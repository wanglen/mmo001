/**
 * @typedef {import('../events.js').EVENTS} EventMap
 */

/**
 * Server-side plugin manifest.
 *
 * @typedef {object} ServerPlugin
 * @property {string} id — unique plugin id (e.g. 'combat')
 * @property {string[]} [dependsOn] — ids that must register before this plugin
 * @property {string[]} [events] — socket events registered (for duplicate detection in tests)
 * @property {(socket: import('socket.io').Socket, ctx: ServerContext) => void} [registerServer]
 * @property {(bus: ReturnType<import('../../server/app/EventBus.js').createEventBus>, ctx: ServerContext) => void} [registerBus]
 * @property {(playerId: string, ctx: ServerContext) => void | Promise<void>} [onDisconnect]
 * @property {(playerId: string, ctx: ServerContext) => void} [onPlayerJoined]
 * @property {(player: object, now: number) => object} [serializePlayer] — partial player JSON slice
 * @property {(ctx: WorldSerializeContext) => object} [serializeWorld] — partial world-state slice
 */

/**
 * @typedef {object} WorldSerializeContext
 * @property {object} world
 * @property {import('../../server/players/PlayerManager.js').PlayerManager} playerManager
 * @property {string} viewerId
 * @property {number} now
 * @property {boolean} includeMapTiles
 * @property {(player: object) => object | null} composePlayer
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
 * @property {ReturnType<import('../../server/app/EventBus.js').createEventBus>} eventBus
 * @property {ServerPlugin[]} plugins
 * @property {Record<string, ServerPlugin>} pluginsById
 * @property {(playerId: string) => Promise<void>} disconnectPlayer
 * @property {(playerId: string) => void} notifyPlayerJoined
 */

/**
 * Client-side plugin manifest.
 *
 * @typedef {object} ClientPlugin
 * @property {string} id
 * @property {string[]} [dependsOn]
 * @property {(ctx: ClientContext) => void} [registerClient]
 */

/**
 * @typedef {object} ClientContext
 * @property {import('../../public/js/network/socketClient.js').SocketClient} socketClient
 * @property {HTMLCanvasElement} canvas
 * @property {import('../../public/js/app/UIManager.js').UIManager} uiManager
 * @property {import('../../public/js/app/PluginHost.js').PluginHost} pluginHost
 * @property {Record<string, unknown>} panels
 * @property {(id: string, panel: object, options?: { blocksInput?: boolean, zIndex?: number }) => void} registerPanel
 * @property {(fn: () => boolean) => void} registerInputBlocker
 * @property {(game: import('../../public/js/game/Game.js').Game) => void} setGame
 * @property {(characterSelect: object) => void} setCharacterSelect
 * @property {(disconnectModal: object) => void} setDisconnectModal
 * @property {(value: boolean) => void} setInGame
 * @property {() => boolean} isInGame
 * @property {(message: string) => void} handleForcedDisconnect
 */

export {};
