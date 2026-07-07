import { CHAT_CHANNEL } from '/shared/social.js';
import { SocketClient } from '../network/socketClient.js';
import { AuthManager } from '../auth/AuthManager.js';
import { PluginHost } from './PluginHost.js';
import { UIManager } from './UIManager.js';
import { loadClientPlugins } from './loadClientPlugins.js';
import { finalizeCoreClient } from '../plugins/core/index.js';
import { fetchAppVersion, formatVersionLabel } from '../appVersion.js';

/** Boot the client: register plugins, wire session lifecycle, start game shell. */
export function bootstrap() {
  const canvas = document.getElementById('game-canvas');
  const authManager = new AuthManager();
  const socketClient = new SocketClient({ token: authManager.getToken() });

  const uiManager = new UIManager();
  const pluginHost = new PluginHost({ socketClient, canvas, uiManager, authManager });

  for (const plugin of loadClientPlugins()) {
    pluginHost.register(plugin);
  }

  const ctx = pluginHost.createContext();
  finalizeCoreClient(ctx);

  const chatPanel = ctx.panels.chatPanel;
  const skillTreePanel = ctx.panels.skillTreePanel;
  const characterSelect = pluginHost.characterSelect;

  fetchAppVersion().then((version) => {
    const label = formatVersionLabel(version);
    const versionEl = document.getElementById('app-version');
    const authVersionEl = document.getElementById('app-version-auth');
    if (versionEl) versionEl.textContent = label;
    if (authVersionEl) authVersionEl.textContent = label;
  });

  window.addEventListener('mmo:authenticated', (event) => {
    socketClient.setAuthToken(event.detail?.token ?? authManager.getToken());
    socketClient.ensureConnected().finally(() => {
      characterSelect?.showAfterAuth();
    });
  });

  window.addEventListener('mmo:logout', () => {
    socketClient.socket.disconnect();
    pluginHost.setInGame(false);
    characterSelect?.hide();
  });

  if (authManager.isAuthenticated()) {
    authManager.hide();
    socketClient.ensureConnected().finally(() => {
      characterSelect?.showAfterAuth();
    });
  } else {
    authManager.show();
    characterSelect?.hide();
  }

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
