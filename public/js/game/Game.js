import { Input } from './Input.js';
import { Camera } from './Camera.js';
import { PathFollower } from './PathFollower.js';
import { Renderer } from '../render/Renderer.js';
import { CursorManager } from '../ui/CursorManager.js';
import { facingFromTarget } from '/shared/aim.js';
import { findMonsterAt, isInRange, ATTACK_COOLDOWN_MS } from '/shared/combat.js';
import { findLootAt, isInPickupRange } from '/shared/inventory.js';
import { getSkill, getSkillFxDuration, resolveProjectileImpact } from '/shared/skills.js';
import { CAMERA_ZOOM_STEP } from '../config.js';
import { FxBuffer } from './FxBuffer.js';

const LERP = 0.3;
const MOVE_INTERVAL = 50;
const AIM_INTERVAL = 50;

export class Game {
  constructor(canvas, socketClient, inventoryPanel = null, levelUpPanel = null, skillBar = null) {
    this.canvas = canvas;
    this.socketClient = socketClient;
    this.inventoryPanel = inventoryPanel;
    this.levelUpPanel = levelUpPanel;
    this.skillBar = skillBar;
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
    this.lootTargetId = null;
    this.inventoryVisible = true;
    this.gamePaused = false;
    this.fxBuffer = new FxBuffer();

    window.addEventListener('resize', () => this.renderer.resize());
    this.renderer.resize();
  }

  setWorldState(state) {
    this.worldState = state;
    this.fxBuffer.ingestCombat(state.combatFx);
    this.fxBuffer.ingestSkill(state.skillFx);

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
      this.levelUpPanel?.update(state.player);
      this.skillBar?.update(state.player);
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
    this.displayPlayer.statPoints = server.statPoints;
    this.displayPlayer.skillPoints = server.skillPoints;
    this.displayPlayer.hp = server.hp;
    this.displayPlayer.maxHp = server.maxHp;
    this.displayPlayer.mp = server.mp;
    this.displayPlayer.maxMp = server.maxMp;
    this.displayPlayer.str = server.str;
    this.displayPlayer.dex = server.dex;
    this.displayPlayer.int = server.int;
    this.displayPlayer.vit = server.vit;
    this.displayPlayer.skillCooldowns = server.skillCooldowns;
    this.displayPlayer.skillBar = server.skillBar;
  }

  onGamePause(paused) {
    this.gamePaused = paused;
    if (paused) {
      this.pathFollower.clear();
      this.attackTargetId = null;
      this.lootTargetId = null;
    }
  }

  focusCanvas() {
    this.canvas.focus();
  }

  isStatKey(e) {
    return e.key.toLowerCase() === 'c' || e.code === 'KeyC';
  }

  onStatKeyDown(e) {
    if (!this.input.gameActive || e.repeat) return;
    if (!this.isStatKey(e)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (!this.worldState?.player) return;

    e.preventDefault();
    e.stopPropagation();
    this.toggleStatPanel();
  }

  toggleStatPanel() {
    if (!this.levelUpPanel) return;

    if (this.levelUpPanel.isVisible()) {
      this.levelUpPanel.hide();
      return;
    }

    const player = this.worldState?.player ?? this.displayPlayer;
    if (player) {
      this.levelUpPanel.openForStatPoints(player);
    }
  }

  handleClick() {
    if (this.gamePaused) return;
    const click = this.input.consumeClick();
    if (!click || !this.worldState?.map || !this.displayPlayer) return;

    const world = this.camera.screenToWorld(click.screenX, click.screenY);
    const loot = findLootAt(this.worldState.loot ?? [], world.x, world.y);

    if (loot) {
      this.lootTargetId = loot.id;
      this.attackTargetId = null;
      return;
    }

    const monsters = this.worldState.monsters ?? [];
    const target = findMonsterAt(monsters, world.x, world.y);

    if (target) {
      this.attackTargetId = target.id;
      this.lootTargetId = null;
      return;
    }

    this.attackTargetId = null;
    this.lootTargetId = null;
    this.pathFollower.setPath(
      this.worldState.map,
      this.displayPlayer.x,
      this.displayPlayer.y,
      world.x,
      world.y
    );
  }

  handleAim(timestamp) {
    if (this.gamePaused) return;
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

  handleLootChase(timestamp) {
    if (!this.lootTargetId || !this.displayPlayer || !this.worldState) return;

    const drop = (this.worldState.loot ?? []).find((l) => l.id === this.lootTargetId);
    if (!drop) {
      this.lootTargetId = null;
      return;
    }

    const px = this.displayPlayer.x;
    const py = this.displayPlayer.y;

    if (isInPickupRange(px, py, drop.x, drop.y)) {
      this.pathFollower.clear();
      this.socketClient.sendPickup(drop.id);
      this.lootTargetId = null;
      return;
    }

    if (timestamp - this.lastChasePathTime >= MOVE_INTERVAL) {
      this.pathFollower.setPath(this.worldState.map, px, py, drop.x, drop.y);
      this.lastChasePathTime = timestamp;
    }
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
    if (this.gamePaused) return;
    if (!this.input.consumeKeyPress('i')) return;
    this.inventoryVisible = !this.inventoryVisible;
    this.inventoryPanel?.setVisible(this.inventoryVisible);
  }

  handleSkills() {
    if (this.gamePaused) return;
    const slot = this.input.consumeSkillSlot();
    if (slot === null || !this.worldState?.player || !this.displayPlayer) return;

    const skill = this.worldState.player.skillBar?.[slot];
    if (!skill) return;

    const aim = this.aimTarget ?? {
      x: this.displayPlayer.aimX ?? this.displayPlayer.x + 1,
      y: this.displayPlayer.aimY ?? this.displayPlayer.y,
    };
    const skillDef = getSkill(skill.id);
    if (!skillDef) return;

    let shot;
    if (skillDef.type === 'projectile') {
      shot = resolveProjectileImpact(
        this.worldState.monsters ?? [],
        this.displayPlayer.x,
        this.displayPlayer.y,
        aim.x,
        aim.y,
        skillDef.range ?? 200,
        skillDef.radius ?? 24
      );
    } else {
      const target = findMonsterAt(this.worldState.monsters ?? [], aim.x, aim.y);
      shot = {
        impactX: aim.x,
        impactY: aim.y,
        missed: !target,
        monster: target,
      };
    }

    this.fxBuffer.addSkillFx({
      skillId: skill.id,
      x: this.displayPlayer.x,
      y: this.displayPlayer.y,
      impactX: shot.impactX,
      impactY: shot.impactY,
      missed: shot.missed,
      durationMs: getSkillFxDuration(
        skillDef,
        this.displayPlayer.x,
        this.displayPlayer.y,
        shot.impactX,
        shot.impactY
      ),
    });

    this.socketClient.sendUseSkill({
      skillId: skill.id,
      targetX: aim.x,
      targetY: aim.y,
      targetId: shot.monster?.id,
    });
  }

  handleInput(timestamp) {
    if (this.gamePaused) {
      return;
    }

    this.handleClick();
    this.handleInventoryToggle();
    this.handleSkills();
    this.handleAim(timestamp);
    this.handleZoom();

    const keyboardDirection = this.input.getDirection();

    if (keyboardDirection) {
      this.attackTargetId = null;
      this.lootTargetId = null;
      this.pathFollower.clear();
      if (timestamp - this.lastMoveTime >= MOVE_INTERVAL) {
        this.socketClient.sendMove(keyboardDirection);
        this.lastMoveTime = timestamp;
      }
      return;
    }

    this.handleLootChase(timestamp);
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

      const renderState = {
        ...this.worldState,
        combatFx: this.fxBuffer.getCombatFx(),
        skillFx: this.fxBuffer.getSkillFx(),
      };

      this.renderer.draw(
        renderState,
        this.displayPlayer,
        timestamp,
        { moveTarget: this.pathFollower.target }
      );
    }

    requestAnimationFrame((t) => this.loop(t));
  }

  start() {
    this.canvas.classList.add('game-active', 'cursor-move');
    this.input.setGameActive(true);
    this.focusCanvas();

    if (!this._statKeyBound) {
      this._statKeyBound = (e) => this.onStatKeyDown(e);
      document.addEventListener('keydown', this._statKeyBound, true);
    }

    requestAnimationFrame((t) => this.loop(t));
  }
}
