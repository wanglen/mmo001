import { Input } from './Input.js';
import { Camera } from './Camera.js';
import { PathFollower } from './PathFollower.js';
import { Renderer } from '../render/Renderer.js';
import { facingFromTarget } from '/shared/aim.js';
import { CAMERA_ZOOM_STEP } from '../config.js';

const LERP = 0.3;
const MOVE_INTERVAL = 50;
const AIM_INTERVAL = 50;

export class Game {
  constructor(canvas, socketClient) {
    this.canvas = canvas;
    this.socketClient = socketClient;
    this.input = new Input(canvas);
    this.camera = new Camera(canvas);
    this.pathFollower = new PathFollower();
    this.renderer = new Renderer(canvas, this.camera);

    this.worldState = null;
    this.displayPlayer = null;
    this.lastMoveTime = 0;
    this.lastAimTime = 0;
    this.aimTarget = null;

    window.addEventListener('resize', () => this.renderer.resize());
    this.renderer.resize();
  }

  setWorldState(state) {
    this.worldState = state;

    if (!this.displayPlayer && state.player) {
      this.displayPlayer = { ...state.player };
      this.aimTarget = { x: state.player.aimX, y: state.player.aimY };
    } else if (state.player) {
      this.displayPlayer = {
        ...state.player,
        x: this.displayPlayer?.x ?? state.player.x,
        y: this.displayPlayer?.y ?? state.player.y,
        facing: state.player.facing ?? this.displayPlayer?.facing,
      };
      if (!this.input.getMouseScreen()) {
        this.aimTarget = { x: state.player.aimX, y: state.player.aimY };
      }
    }
  }

  updateDisplayPlayer() {
    if (!this.worldState?.player || !this.displayPlayer) return;

    const server = this.worldState.player;
    this.displayPlayer.x += (server.x - this.displayPlayer.x) * LERP;
    this.displayPlayer.y += (server.y - this.displayPlayer.y) * LERP;
    this.displayPlayer.direction = server.direction;
    this.displayPlayer.facing = this.displayPlayer.facing ?? server.facing;
    this.displayPlayer.moving = server.moving;
    this.displayPlayer.characterClass = server.characterClass;
    this.displayPlayer.name = server.name;
  }

  handleClick() {
    const click = this.input.consumeClick();
    if (!click || !this.worldState?.map || !this.displayPlayer) return;

    const world = this.camera.screenToWorld(click.screenX, click.screenY);
    this.pathFollower.setPath(
      this.worldState.map,
      this.displayPlayer.x,
      this.displayPlayer.y,
      world.x,
      world.y
    );
  }

  handleAim(timestamp) {
    const mouse = this.input.getMouseScreen();
    if (!mouse || !this.displayPlayer) return;

    const world = this.camera.screenToWorld(mouse.screenX, mouse.screenY);
    this.aimTarget = world;

    const facing = facingFromTarget(
      this.displayPlayer.x,
      this.displayPlayer.y,
      world.x,
      world.y
    );
    if (facing) this.displayPlayer.facing = facing;

    if (timestamp - this.lastAimTime >= AIM_INTERVAL) {
      this.socketClient.sendAim({ x: world.x, y: world.y });
      this.lastAimTime = timestamp;
    }
  }

  handleZoom() {
    const steps = this.input.consumeZoomDelta();
    if (steps === 0) return;
    this.camera.adjustZoom(steps * CAMERA_ZOOM_STEP);
  }

  handleInput(timestamp) {
    this.handleClick();
    this.handleAim(timestamp);
    this.handleZoom();

    const keyboardDirection = this.input.getDirection();

    if (keyboardDirection) {
      this.pathFollower.clear();
      if (timestamp - this.lastMoveTime >= MOVE_INTERVAL) {
        this.socketClient.sendMove(keyboardDirection);
        this.lastMoveTime = timestamp;
      }
      return;
    }

    if (!this.pathFollower.isActive() || !this.displayPlayer) {
      if (this.displayPlayer) this.displayPlayer.moving = false;
      return;
    }

    const direction = this.pathFollower.getDirection(
      this.displayPlayer.x,
      this.displayPlayer.y
    );

    if (!direction) {
      if (this.displayPlayer) this.displayPlayer.moving = false;
      return;
    }

    if (timestamp - this.lastMoveTime >= MOVE_INTERVAL) {
      this.socketClient.sendMove(direction);
      this.lastMoveTime = timestamp;
    }
  }

  loop(timestamp) {
    if (this.worldState && this.displayPlayer) {
      this.handleInput(timestamp);
      this.updateDisplayPlayer();
      this.camera.follow(this.displayPlayer.x, this.displayPlayer.y);
      this.renderer.draw(
        this.worldState,
        this.displayPlayer,
        timestamp,
        {
          moveTarget: this.pathFollower.target,
          aimTarget: this.aimTarget,
        }
      );
    }

    requestAnimationFrame((t) => this.loop(t));
  }

  start() {
    this.canvas.classList.add('game-active');
    requestAnimationFrame((t) => this.loop(t));
  }
}
