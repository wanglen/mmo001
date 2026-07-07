import { CHAT_CHANNEL } from '/shared/social.js';
import { SocketClient } from '../network/socketClient.js';
import { PluginHost } from './PluginHost.js';
import { UIManager } from './UIManager.js';
import { loadClientPlugins } from './loadClientPlugins.js';
import { finalizeCoreClient } from '../plugins/core/index.js';

/** Boot the client: register plugins, wire session lifecycle, start game shell. */
export function bootstrap() {
  const canvas = document.getElementById('game-canvas');
  const socketClient = new SocketClient();

  const uiManager = new UIManager();
  const pluginHost = new PluginHost({ socketClient, canvas, uiManager });

  for (const plugin of loadClientPlugins()) {
    pluginHost.register(plugin);
  }

  const ctx = pluginHost.createContext();
  finalizeCoreClient(ctx);

  const chatPanel = ctx.panels.chatPanel;
  const skillTreePanel = ctx.panels.skillTreePanel;
  const characterSelect = pluginHost.characterSelect;

  socketClient.onError((err) => {
    console.error('Server error:', err.message);
    if (skillTreePanel?.isVisible()) {
      skillTreePanel.setStatus(err.message);
    }
    if (pluginHost.isInGame()) {
      chatPanel?.appendMessage({
        channel: CHAT_CHANNEL.SYSTEM,
        text: err.message,
      });
      return;
    }
    characterSelect?.showError(err.message);
    document.getElementById('create-submit-btn')?.removeAttribute('disabled');
  });

  socketClient.onSessionEnd(({ message } = {}) => {
    pluginHost.handleForcedDisconnect(message ?? 'This character logged in from another session.');
  });

  socketClient.onDisconnect(() => {
    if (!pluginHost.isInGame()) return;
    pluginHost.handleForcedDisconnect('Disconnected from server.');
  });

  const pendingDisconnect = sessionStorage.getItem('mmo_disconnect_msg');
  if (pendingDisconnect) {
    sessionStorage.removeItem('mmo_disconnect_msg');
    characterSelect?.showError(pendingDisconnect);
  }

  return { pluginHost, socketClient, game: pluginHost.game };
}
