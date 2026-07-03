import { Input } from './Input.js';
import { Camera } from './Camera.js';
import { Renderer } from '../render/Renderer.js';

const LERP = 0.3;
const MOVE_INTERVAL = 50;

export class Game {
  constructor(canvas, socketClient) {
    this.canvas = canvas;
    this.socketClient = socketClient;
    this.input = new Input();
    this.camera = new Camera(canvas);
    this.renderer = new Renderer(canvas, this.camera);

    this.worldState = null;
    this.displayPlayer = null;
    this.lastMoveTime = 0;
    this.currentDirection = null;

    window.addEventListener('resize', () => this.renderer.resize());
    this.renderer.resize();
  }

  setWorldState(state) {
    this.worldState = state;

    if (!this.displayPlayer && state.player) {
      this.displayPlayer = { ...state.player };
    } else if (state.player) {
      this.displayPlayer = {
        ...state.player,
        x: this.displayPlayer?.x ?? state.player.x,
        y: this.displayPlayer?.y ?? state.player.y,
      };
    }
  }

  updateDisplayPlayer() {
    if (!this.worldState?.player || !this.displayPlayer) return;

    const server = this.worldState.player;
    this.displayPlayer.x += (server.x - this.displayPlayer.x) * LERP;
    this.displayPlayer.y += (server.y - this.displayPlayer.y) * LERP;
    this.displayPlayer.direction = server.direction;
    this.displayPlayer.moving = server.moving;
    this.displayPlayer.characterClass = server.characterClass;
    this.displayPlayer.name = server.name;
  }

  handleInput(timestamp) {
    const direction = this.input.getDirection();

    if (direction && timestamp - this.lastMoveTime >= MOVE_INTERVAL) {
      this.socketClient.sendMove(direction);
      this.lastMoveTime = timestamp;
      this.currentDirection = direction;
    } else if (!direction) {
      this.currentDirection = null;
      if (this.displayPlayer) this.displayPlayer.moving = false;
    }
  }

  loop(timestamp) {
    if (this.worldState && this.displayPlayer) {
      this.handleInput(timestamp);
      this.updateDisplayPlayer();
      this.camera.follow(this.displayPlayer.x, this.displayPlayer.y);
      this.renderer.draw(this.worldState, this.displayPlayer, timestamp);
    }

    requestAnimationFrame((t) => this.loop(t));
  }

  start() {
    requestAnimationFrame((t) => this.loop(t));
  }
}
