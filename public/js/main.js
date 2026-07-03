import { CharacterSelect } from './ui/CharacterSelect.js';
import { SocketClient } from './network/socketClient.js';
import { Game } from './game/Game.js';

const canvas = document.getElementById('game-canvas');
const socketClient = new SocketClient();
const game = new Game(canvas, socketClient);

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
