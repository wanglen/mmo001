import { CharacterSelect } from './ui/CharacterSelect.js';
import { InventoryPanel } from './ui/InventoryPanel.js';
import { SkillBar } from './ui/SkillBar.js';
import { LevelUpPanel } from './ui/LevelUpPanel.js';
import { DialoguePanel } from './ui/DialoguePanel.js';
import { QuestTracker } from './ui/QuestTracker.js';
import { ChatPanel } from './ui/ChatPanel.js';
import { SocialPanel } from './ui/SocialPanel.js';
import { DisconnectModal } from './ui/DisconnectModal.js';
import { SocketClient } from './network/socketClient.js';
import { Game } from './game/Game.js';

const canvas = document.getElementById('game-canvas');
const socketClient = new SocketClient();
const inventoryPanel = new InventoryPanel(document.getElementById('inventory-panel'));
inventoryPanel.onEquip = (index) => socketClient.sendEquip(index);
inventoryPanel.onUnequip = (slot) => socketClient.sendUnequip(slot);
inventoryPanel.onUseConsumable = (index) => socketClient.sendUseConsumable(index);
inventoryPanel.onDestroy = ({ inventoryIndex, slot }) => socketClient.sendDestroyItem({ inventoryIndex, slot });

const skillBar = new SkillBar(document.getElementById('skill-bar'));

const levelUpPanel = new LevelUpPanel(
  document.getElementById('level-up-panel'),
  document.getElementById('level-up-flash')
);
levelUpPanel.onAllocate = (stat) => socketClient.sendAllocateStat(stat);
levelUpPanel.onRequestCanvasFocus = () => canvas.focus();

const dialoguePanel = new DialoguePanel(document.getElementById('dialogue-panel'));
const questTracker = new QuestTracker(document.getElementById('quest-tracker'));
const chatPanel = new ChatPanel(document.getElementById('chat-panel'));
const socialPanel = new SocialPanel(document.getElementById('social-panel'));
chatPanel.setCanvas(canvas);

const disconnectModal = new DisconnectModal(
  document.getElementById('disconnect-overlay'),
  document.getElementById('disconnect-message'),
  document.getElementById('disconnect-reload-btn')
);
disconnectModal.onReload = () => {
  const message = document.getElementById('disconnect-message')?.textContent;
  if (message) sessionStorage.setItem('mmo_disconnect_msg', message);
  window.location.reload();
};

chatPanel.onSend = ({ text, channel }) => socketClient.sendChat({ text, channel });
socialPanel.onInvite = (targetName) => socketClient.sendPartyInvite(targetName);
socialPanel.onAcceptInvite = () => socketClient.sendPartyAccept();
socialPanel.onDeclineInvite = () => socketClient.sendPartyDecline();
socialPanel.onLeaveParty = () => socketClient.sendPartyLeave();

const game = new Game(
  canvas,
  socketClient,
  inventoryPanel,
  levelUpPanel,
  skillBar,
  dialoguePanel,
  questTracker,
  chatPanel,
  socialPanel
);
levelUpPanel.onPauseChange = (paused) => game.onGamePause(paused);

let inGame = false;
let disconnectHandled = false;

function handleForcedDisconnect(message) {
  if (disconnectHandled) return;
  disconnectHandled = true;
  inGame = false;
  game.stop();
  chatPanel.hide();
  socialPanel.hide();
  questTracker.update(null);
  document.getElementById('character-select')?.classList.add('hidden');
  disconnectModal.show(message);
}

socketClient.onWorldState((state) => {
  game.setWorldState(state);
});

socketClient.onChatMessage((msg) => chatPanel.appendMessage(msg));
socketClient.onOnlinePlayers((payload) => socialPanel.updateOnline(payload));
socketClient.onPartyState((state) => socialPanel.updateParty(state));

const characterSelect = new CharacterSelect({
  socketClient,
  onStart: () => {
    inGame = true;
    chatPanel.show();
    socialPanel.show();
    game.start();
  },
});

socketClient.onError((err) => {
  console.error('Server error:', err.message);
  if (!inGame) {
    characterSelect.showError(err.message);
    document.getElementById('create-submit-btn')?.removeAttribute('disabled');
  }
});

socketClient.onSessionEnd(({ message } = {}) => {
  handleForcedDisconnect(message ?? 'This character logged in from another session.');
});

socketClient.onDisconnect(() => {
  if (!inGame) return;
  handleForcedDisconnect('Disconnected from server.');
});

// Show message after reload when kicked (optional persistence)
const pendingDisconnect = sessionStorage.getItem('mmo_disconnect_msg');
if (pendingDisconnect) {
  sessionStorage.removeItem('mmo_disconnect_msg');
  characterSelect.showError(pendingDisconnect);
}
