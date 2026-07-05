import { CharacterSelect } from './ui/CharacterSelect.js';
import { InventoryPanel } from './ui/InventoryPanel.js';
import { SocketClient } from './network/socketClient.js';
import { Game } from './game/Game.js';

const canvas = document.getElementById('game-canvas');
const socketClient = new SocketClient();
const inventoryPanel = new InventoryPanel(document.getElementById('inventory-panel'));
inventoryPanel.onEquip = (index) => socketClient.sendEquip(index);
inventoryPanel.onUnequip = (slot) => socketClient.sendUnequip(slot);

const game = new Game(canvas, socketClient, inventoryPanel);

socketClient.onWorldState((state) => {
  game.setWorldState(state);
});

socketClient.onError((err) => {
  console.error('Server error:', err.message);
});

new CharacterSelect({
  onStart: ({ characterClass, name }) => {
    game.start();
    socketClient.join({ characterClass, name });
  },
});
