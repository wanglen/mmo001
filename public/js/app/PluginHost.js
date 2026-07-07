/**
 * Registers client feature plugins and aggregates input-blocking state.
 */
export class PluginHost {
  /**
   * @param {object} deps
   * @param {import('../network/socketClient.js').SocketClient} deps.socketClient
   * @param {HTMLCanvasElement} deps.canvas
   * @param {import('./UIManager.js').UIManager} deps.uiManager
   */
  constructor({ socketClient, canvas, uiManager, authManager = null }) {
    this.socketClient = socketClient;
    this.canvas = canvas;
    this.uiManager = uiManager;
    this.authManager = authManager;
    /** @type {import('../../../shared/plugins/types.js').ClientPlugin[]} */
    this.plugins = [];
    /** @type {Record<string, unknown>} */
    this.panels = {};
    /** @type {Array<() => boolean>} */
    this.inputBlockers = [];
    this.game = null;
    this.characterSelect = null;
    this.disconnectModal = null;
    this.inGame = false;
    this.disconnectHandled = false;
  }

  /**
   * @param {import('../../../shared/plugins/types.js').ClientPlugin} plugin
   */
  register(plugin) {
    plugin.registerClient?.(this.createContext());
    this.plugins.push(plugin);
  }

  registerInputBlocker(fn) {
    this.inputBlockers.push(fn);
  }

  blocksGameInput() {
    if (this.uiManager.blocksGameInput()) return true;
    return this.inputBlockers.some((fn) => fn());
  }

  isInGame() {
    return this.inGame;
  }

  setInGame(value) {
    this.inGame = value;
  }

  /** @returns {import('../../../shared/plugins/types.js').ClientContext} */
  createContext() {
    return {
      socketClient: this.socketClient,
      canvas: this.canvas,
      uiManager: this.uiManager,
      authManager: this.authManager,
      pluginHost: this,
      panels: this.panels,
      registerPanel: (id, panel, options) => {
        this.panels[id] = panel;
        this.uiManager.register(id, panel, options);
      },
      registerInputBlocker: (fn) => this.registerInputBlocker(fn),
      setGame: (game) => {
        this.game = game;
      },
      setCharacterSelect: (characterSelect) => {
        this.characterSelect = characterSelect;
      },
      setDisconnectModal: (disconnectModal) => {
        this.disconnectModal = disconnectModal;
      },
      setInGame: (value) => this.setInGame(value),
      isInGame: () => this.isInGame(),
      handleForcedDisconnect: (message) => this.handleForcedDisconnect(message),
    };
  }

  handleForcedDisconnect(message) {
    if (this.disconnectHandled) return;
    this.disconnectHandled = true;
    this.inGame = false;
    this.game?.stop();
    this.uiManager.get('chat')?.hide?.();
    this.uiManager.get('social')?.hide?.();
    this.uiManager.get('vendor')?.hide?.();
    this.uiManager.get('trade')?.hide?.();
    this.panels.questTracker?.update?.(null);
    document.getElementById('character-select')?.classList.add('hidden');
    this.disconnectModal?.show(message);
  }
}
