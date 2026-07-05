import { Input } from './Input.js';
import { Camera } from './Camera.js';
import { PathFollower } from './PathFollower.js';
import { Renderer } from '../render/Renderer.js';
import { CursorManager } from '../ui/CursorManager.js';
import { facingFromTarget } from '/shared/aim.js';
import { findMonsterAt, isInRange, ATTACK_COOLDOWN_MS } from '/shared/combat.js';
import { findLootAt } from '/shared/inventory.js';
import { CAMERA_ZOOM_STEP } from '../config.js';

const LERP = 0.3;
const MOVE_INTERVAL = 50;
const AIM_INTERVAL = 50;

export class Game {
  constructor(canvas, socketClient, inventoryPanel = null) {
    this.canvas = canvas;
    this.socketClient = socketClient;
    this.inventoryPanel = inventoryPanel;
    this.input = new Input(canvas);
    this.camera = new Camera(canvas);
    this.cursorManager = new CursorManager(canvas);
    this.pathFollower = new PathFollower();
    this.renderer = new Renderer(canvas, this.camera);

    this.worldState = null;
    this.displayPlayer = null;
    this.lastMoveTime = 0;
    this.lastAimTime = 0;
    this.lastAttackTime = 0;
    this.lastChasePathTime = 0;
    this.aimTarget = null;
    this.attackTargetId = null;
    this.inventoryVisible = true;

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
        attacking: state.player.attacking,
      };
      if (!this.input.getMouseScreen()) {
        this.aimTarget = { x: state.player.aimX, y: state.player.aimY };
      }
      this.inventoryPanel?.update(state.player);
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
    this.displayPlayer.attacking = server.attacking;
    this.displayPlayer.characterClass = server.characterClass;
    this.displayPlayer.name = server.name;
    this.displayPlayer.level = server.level;
    this.displayPlayer.xp = server.xp;
    this.displayPlayer.hp = server.hp;
    this.displayPlayer.maxHp = server.maxHp;
    this.displayPlayer.mp = server.mp;
    this.displayPlayer.maxMp = server.maxMp;
    this.displayPlayer.str = server.str;
    this.displayPlayer.dex = server.dex;
    this.displayPlayer.int = server.int;
    this.displayPlayer.vit = server.vit;
  }

  handleClick() {
    const click = this.input.consumeClick();
    if (!click || !this.worldState?.map || !this.displayPlayer) return;

    const world = this.camera.screenToWorld(click.screenX, click.screenY);
    const loot = findLootAt(this.worldState.loot ?? [], world.x, world.y);

    if (loot) {
      this.socketClient.sendPickup(loot.id);
      return;
    }

    const monsters = this.worldState.monsters ?? [];
    const target = findMonsterAt(monsters, world.x, world.y);

    if (target) {
      this.attackTargetId = target.id;
      return;
    }

    this.attackTargetId = null;
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
    this.cursorManager.update(world, this.worldState.monsters ?? [], this.worldState.loot ?? []);

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

  handleAttackChase(timestamp) {
    if (!this.attackTargetId || !this.displayPlayer || !this.worldState) return;

    const target = (this.worldState.monsters ?? []).find((m) => m.id === this.attackTargetId);
    if (!target || target.hp <= 0) {
      this.attackTargetId = null;
      return;
    }

    const px = this.displayPlayer.x;
    const py = this.displayPlayer.y;

    if (isInRange(px, py, target.x, target.y)) {
      this.pathFollower.clear();
      if (timestamp - this.lastAttackTime >= ATTACK_COOLDOWN_MS) {
        this.socketClient.sendAttack(target.id);
        this.lastAttackTime = timestamp;
      }
      return;
    }

    if (timestamp - this.lastChasePathTime >= MOVE_INTERVAL) {
      this.pathFollower.setPath(this.worldState.map, px, py, target.x, target.y);
      this.lastChasePathTime = timestamp;
    }
  }

  handleInventoryToggle() {
    if (!this.input.consumeKeyPress('i')) return;
    this.inventoryVisible = !this.inventoryVisible;
    this.inventoryPanel?.setVisible(this.inventoryVisible);
  }

  handleInput(timestamp) {
    this.handleClick();
    this.handleInventoryToggle();
    this.handleAim(timestamp);
    this.handleZoom();

    const keyboardDirection = this.input.getDirection();

    if (keyboardDirection) {
      this.attackTargetId = null;
      this.pathFollower.clear();
      if (timestamp - this.lastMoveTime >= MOVE_INTERVAL) {
        this.socketClient.sendMove(keyboardDirection);
        this.lastMoveTime = timestamp;
      }
      return;
    }

    this.handleAttackChase(timestamp);

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
        { moveTarget: this.pathFollower.target }
      );
    }

    requestAnimationFrame((t) => this.loop(t));
  }

  start() {
    this.canvas.classList.add('game-active', 'cursor-move');
    requestAnimationFrame((t) => this.loop(t));
  }
}
