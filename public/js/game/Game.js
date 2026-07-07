import { Input } from './Input.js';
import { Camera } from '../core/Camera.js';
import { PathFollower } from '../core/PathFollower.js';
import { FogOfWar } from '../core/FogOfWar.js';
import { GameLoop } from '../core/GameLoop.js';
import { InputRouter } from '../core/InputRouter.js';
import { onStatKeyDown } from '../plugins/core/CoreInput.js';
import { Renderer } from '../render/Renderer.js';
import { CursorManager } from '../ui/CursorManager.js';
import { NPC_ROLE } from '/shared/npcs.js';
import { FxBuffer } from './FxBuffer.js';
import { RemotePlayerDisplay } from './RemotePlayerDisplay.js';

/** Composition root for in-game client state, panels, and the render loop. */
export class Game {
  constructor(
    canvas,
    socketClient,
    inventoryPanel = null,
    levelUpPanel = null,
    skillBar = null,
    dialoguePanel = null,
    questTracker = null,
    chatPanel = null,
    socialPanel = null,
    vendorPanel = null,
    tradePanel = null,
    pluginHost = null
  ) {
    this.canvas = canvas;
    this.socketClient = socketClient;
    this.inventoryPanel = inventoryPanel;
    this.levelUpPanel = levelUpPanel;
    this.skillBar = skillBar;
    this.dialoguePanel = dialoguePanel;
    this.questTracker = questTracker;
    this.chatPanel = chatPanel;
    this.socialPanel = socialPanel;
    this.vendorPanel = vendorPanel;
    this.tradePanel = tradePanel;
    this.pluginHost = pluginHost;

    this.input = new Input(canvas);
    this.camera = new Camera(canvas);
    this.cursorManager = new CursorManager(canvas);
    this.pathFollower = new PathFollower();
    this.renderer = new Renderer(canvas, this.camera);
    this.fxBuffer = new FxBuffer();
    this.fogOfWar = new FogOfWar();
    this.remotePlayerDisplay = new RemotePlayerDisplay();
    this.inputRouter = new InputRouter(this);

    this.worldState = null;
    this.displayPlayer = null;
    this.lastMoveTime = 0;
    this.lastAimTime = 0;
    this.lastAttackTime = 0;
    this.lastChasePathTime = 0;
    this.aimTarget = null;
    this.attackTargetId = null;
    this.lootTargetId = null;
    this.npcTargetId = null;
    this.inventoryVisible = false;
    this.gamePaused = false;
    this.isDead = false;

    if (this.chatPanel) {
      this.chatPanel.onFocus = () => this.input.clearKeys();
    }

    this.deathOverlay = document.getElementById('death-overlay');
    this.inventoryBackdrop = document.getElementById('inventory-backdrop');

    this.gameLoop = new GameLoop(this, {
      canvas,
      input: this.input,
      camera: this.camera,
      pathFollower: this.pathFollower,
      renderer: this.renderer,
      fogOfWar: this.fogOfWar,
      fxBuffer: this.fxBuffer,
      remotePlayerDisplay: this.remotePlayerDisplay,
      inputRouter: this.inputRouter,
      deathOverlay: this.deathOverlay,
      mapLoadingOverlay: document.getElementById('map-loading-overlay'),
    });

    this.inventoryBackdrop?.addEventListener('click', () => {
      if (this.inventoryVisible) this.setInventoryVisible(false);
    });

    document.getElementById('respawn-btn')?.addEventListener('click', () => {
      this.socketClient.sendRespawn();
    });

    window.addEventListener('resize', () => this.renderer.resize());
    this.renderer.resize();
    this.inventoryPanel?.setVisible(false);
  }

  setInventoryVisible(visible) {
    this.inventoryVisible = visible;
    this.inventoryPanel?.setVisible(visible);
    if (!visible) {
      this.inventoryPanel?.hideContextMenu?.();
    }
  }

  setWorldState(state) {
    this.gameLoop.setWorldState(state);
  }

  npcDialogueHandlers(npc) {
    return {
      onAccept: (questId) => this.socketClient.sendQuestAccept(questId, npc.id),
      onTurnIn: (questId) => this.socketClient.sendQuestTurnIn(questId, npc.id),
    };
  }

  openNpcDialogue(npc, player = this.worldState?.player) {
    if (!npc || !player) return;
    this.dialoguePanel?.show(npc, player, this.npcDialogueHandlers(npc));
  }

  beginNpcInteraction(npc) {
    if (!npc) return;
    this.socketClient.sendNpcInteract(npc.id);
    if (npc.role === NPC_ROLE.VENDOR || npc.vendorId) {
      this.socketClient.sendVendorOpen(npc.id);
      return;
    }
    this.openNpcDialogue(npc);
  }

  openVendor(npcId, catalog) {
    const npc = (this.worldState?.npcs ?? []).find((entry) => entry.id === npcId) ?? { id: npcId };
    this.vendorPanel?.open(npc, catalog, this.worldState?.player);
  }

  updateTradeState(state) {
    this.tradePanel?.update(state, this.worldState?.player);
  }

  pickableLoot() {
    return (this.worldState?.loot ?? []).filter((drop) => !drop.pickupLocked);
  }

  isRecalling() {
    return !!this.worldState?.player?.townRecallCasting;
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

  start() {
    this.canvas.classList.add('game-active', 'cursor-move');
    this.input.setGameActive(true);
    this.focusCanvas();

    if (!this._statKeyBound) {
      this._statKeyBound = (e) => onStatKeyDown(this, e);
      document.addEventListener('keydown', this._statKeyBound, true);
    }

    this.gameLoop.start();
  }

  stop() {
    this.input.setGameActive(false);
    this.input.clearKeys();
    this.canvas.classList.remove('game-active', 'cursor-move', 'cursor-attack', 'cursor-loot', 'cursor-portal');

    this.worldState = null;
    this.displayPlayer = null;
    this.isDead = false;
    this.gamePaused = false;
    this.attackTargetId = null;
    this.lootTargetId = null;
    this.npcTargetId = null;
    this.pathFollower.clear();
    this.remotePlayerDisplay.clear();
    this.fxBuffer = new FxBuffer();
    this.gameLoop.fxBuffer = this.fxBuffer;

    this.setInventoryVisible(false);
    this.levelUpPanel?.hide();
    this.dialoguePanel?.hide();
    this.deathOverlay?.classList.add('hidden');
    this.gameLoop.hideMapLoading();

    this.chatPanel?.blur();
  }
}
