import { CharacterSelect } from './ui/CharacterSelect.js';
import { InventoryPanel } from './ui/InventoryPanel.js';
import { SkillBar } from './ui/SkillBar.js';
import { LevelUpPanel } from './ui/LevelUpPanel.js';
import { DialoguePanel } from './ui/DialoguePanel.js';
import { SocketClient } from './network/socketClient.js';
import { Game } from './game/Game.js';

const canvas = document.getElementById('game-canvas');
const socketClient = new SocketClient();
const inventoryPanel = new InventoryPanel(document.getElementById('inventory-panel'));
inventoryPanel.onEquip = (index) => socketClient.sendEquip(index);
inventoryPanel.onUnequip = (slot) => socketClient.sendUnequip(slot);
inventoryPanel.onUseConsumable = (index) => socketClient.sendUseConsumable(index);

const skillBar = new SkillBar(document.getElementById('skill-bar'));

const levelUpPanel = new LevelUpPanel(
  document.getElementById('level-up-panel'),
  document.getElementById('level-up-flash')
);
levelUpPanel.onAllocate = (stat) => socketClient.sendAllocateStat(stat);
levelUpPanel.onRequestCanvasFocus = () => canvas.focus();

const dialoguePanel = new DialoguePanel(document.getElementById('dialogue-panel'));

const game = new Game(canvas, socketClient, inventoryPanel, levelUpPanel, skillBar, dialoguePanel);
levelUpPanel.onPauseChange = (paused) => game.onGamePause(paused);

socketClient.onWorldState((state) => {
  game.setWorldState(state);
});

const characterSelect = new CharacterSelect({
  socketClient,
  onStart: () => {
    game.start();
  },
});

socketClient.onError((err) => {
  console.error('Server error:', err.message);
  characterSelect.showError(err.message);
  document.getElementById('create-submit-btn')?.removeAttribute('disabled');
});
