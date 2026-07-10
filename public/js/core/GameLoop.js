import { isTownHubMap } from '/shared/townHub.js';
import { findMonsterAt } from '/shared/combat.js';
import { filterRevealedPositions } from '/shared/fog.js';
import { TILE_SIZE } from '../config.js';
import { applyWorldStateDelta } from '/shared/plugins/world/delta.js';
import {
  createEmptyTileGrid,
  mergeMapTileChunks,
} from '/shared/plugins/world/chunks.js';
import { configureClientEventLog } from '../debug/clientEventLog.js';
import { getMapDisplayName } from '/shared/worldMaps.js';

const LERP = 0.3;

/**
 * Client rAF loop: world-state sync, display interpolation, render.
 */
export class GameLoop {
  /**
   * @param {import('../game/Game.js').Game} game
   * @param {object} deps
   */
  constructor(game, deps) {
    this.game = game;
    this.canvas = deps.canvas;
    this.input = deps.input;
    this.camera = deps.camera;
    this.pathFollower = deps.pathFollower;
    this.renderer = deps.renderer;
    this.fogOfWar = deps.fogOfWar;
    this.fxBuffer = deps.fxBuffer;
    this.remotePlayerDisplay = deps.remotePlayerDisplay;
    this.inputRouter = deps.inputRouter;
    this.deathOverlay = deps.deathOverlay;
    this.mapLoadingOverlay = deps.mapLoadingOverlay;
    this.mapLoadingTimer = null;
  }

  setWorldState(incoming) {
    const game = this.game;
    let state = applyWorldStateDelta(game.worldState, incoming);
    const prevMap = game.worldState?.map;
    const mapIdChanged =
      prevMap?.mapId && state.map?.mapId && prevMap.mapId !== state.map.mapId;

    if (mapIdChanged) {
      this.showMapLoading(state.map?.mapId);
      this.pathFollower.clear();
      game.attackTargetId = null;
      game.lootTargetId = null;
      game.portalTargetId = null;
      game.chestTarget = null;
      game.dialoguePanel?.hide();
      game.vendorPanel?.hide();
      this.remotePlayerDisplay.clear();

      if (state.map?.tileChunks) {
        const tiles = createEmptyTileGrid(state.map.width, state.map.height);
        mergeMapTileChunks(tiles, state.map.tileChunks);
        state = {
          ...state,
          map: {
            ...state.map,
            tiles,
          },
        };
        delete state.map.tileChunks;
      }
    } else if (state.map?.tileChunks) {
      const width = state.map.width;
      const height = state.map.height;
      const tiles = createEmptyTileGrid(width, height, prevMap?.tiles ?? null);
      mergeMapTileChunks(tiles, state.map.tileChunks);
      state = {
        ...state,
        map: {
          ...state.map,
          tiles,
          zones: state.map.zones?.length ? state.map.zones : prevMap?.zones,
          portals: state.map.portals?.length ? state.map.portals : prevMap?.portals,
        },
      };
      delete state.map.tileChunks;
    } else if (prevMap && state.map && !state.map.tiles) {
      state = {
        ...state,
        map: {
          ...state.map,
          tiles: prevMap.tiles,
          zones: state.map.zones?.length ? state.map.zones : prevMap.zones,
          portals: state.map.portals?.length ? state.map.portals : prevMap.portals,
        },
      };
    }

    game.worldState = state;
    this.notifyPickupSuccess(state);
    if (state.debug && !game.clientDebugLogEnabled) {
      game.clientDebugLogEnabled = true;
      configureClientEventLog({
        active: true,
        send: (payload) => game.socketClient.sendDebugLog(payload),
      });
    }
    if (state.map) {
      this.camera.setMapBounds(state.map.width, state.map.height, TILE_SIZE);
      if (state.map.tiles) {
        this.hideMapLoading();
      }
    }
    this.fxBuffer.ingestCombat(state.combatFx);
    this.fxBuffer.ingestSkill(state.skillFx);
    game.gameAudio.onWorldState(game, state, state.combatFx ?? []);
    game.gameParticles.onWorldState(game, state, state.combatFx ?? [], state.skillFx ?? []);

    game.isDead = !!state.player?.dead;
    this.deathOverlay?.classList.toggle('hidden', !game.isDead);
    if (game.isDead) {
      this.pathFollower.clear();
      game.attackTargetId = null;
      game.lootTargetId = null;
      game.portalTargetId = null;
    }

    if (!game.displayPlayer && state.player) {
      game.displayPlayer = { ...state.player };
      game.aimTarget = { x: state.player.aimX, y: state.player.aimY };
    } else if (state.player) {
      if (mapIdChanged) {
        game.displayPlayer = { ...state.player };
        game.aimTarget = { x: state.player.aimX, y: state.player.aimY };
      } else {
        game.displayPlayer = {
          ...state.player,
          x: game.displayPlayer?.x ?? state.player.x,
          y: game.displayPlayer?.y ?? state.player.y,
          facing: state.player.facing ?? game.displayPlayer?.facing,
          attacking: state.player.attacking,
        };
        if (!this.input.getMouseScreen()) {
          game.aimTarget = { x: state.player.aimX, y: state.player.aimY };
        }
      }
      const inTown = isTownHubMap(state.map);
      game.inventoryPanel?.update(state.player, { townFeaturesEnabled: inTown });
      game.stashPanel?.update(state.player);
      if (!inTown && game.stashVisible) game.setStashVisible(false);
      game.levelUpPanel?.update(state.player);
      game.skillTreePanel?.update(state.player, { townFeaturesEnabled: inTown });
      game.skillBar?.update(state.player, state);
      game.questTracker?.update(state.player);
      game.socialPanel?.setSelf(state.player);
      if (game.vendorPanel?.isVisible()) {
        game.vendorPanel.update(state.player);
      }

      if (game.dialoguePanel?.isVisible() && game.dialoguePanel.currentNpc && state.player) {
        const npc = (state.npcs ?? []).find(
          (entry) => entry.id === game.dialoguePanel.currentNpc.id
        );
        if (npc) {
          game.dialoguePanel.currentNpc = npc;
          game.dialoguePanel.refreshContent(state.player);
        }
      }
    }
  }

  updateDisplayPlayer() {
    const game = this.game;
    if (!game.worldState?.player || !game.displayPlayer) return;

    const server = game.worldState.player;
    game.displayPlayer.x += (server.x - game.displayPlayer.x) * LERP;
    game.displayPlayer.y += (server.y - game.displayPlayer.y) * LERP;
    game.displayPlayer.direction = server.direction;
    game.displayPlayer.facing = game.displayPlayer.facing ?? server.facing;
    game.displayPlayer.moving = server.moving;
    game.displayPlayer.attacking = server.attacking;
    game.displayPlayer.characterClass = server.characterClass;
    game.displayPlayer.name = server.name;
    game.displayPlayer.level = server.level;
    game.displayPlayer.xp = server.xp;
    game.displayPlayer.statPoints = server.statPoints;
    game.displayPlayer.skillPoints = server.skillPoints;
    game.displayPlayer.hp = server.hp;
    game.displayPlayer.maxHp = server.maxHp;
    game.displayPlayer.dead = server.dead;
    game.displayPlayer.mp = server.mp;
    game.displayPlayer.maxMp = server.maxMp;
    game.displayPlayer.str = server.str;
    game.displayPlayer.dex = server.dex;
    game.displayPlayer.int = server.int;
    game.displayPlayer.vit = server.vit;
    game.displayPlayer.gold = server.gold;
    game.displayPlayer.quests = server.quests;
    game.displayPlayer.skillCooldowns = server.skillCooldowns;
    game.displayPlayer.skillBar = server.skillBar;
    game.displayPlayer.townRecallCasting = server.townRecallCasting;
    game.displayPlayer.townRecallCastMs = server.townRecallCastMs;
    game.displayPlayer.openedChests = server.openedChests;
  }

  /** @param {string | null | undefined} [mapId] */
  showMapLoading(mapId) {
    const name = getMapDisplayName(mapId);
    const titleEl = this.mapLoadingOverlay?.querySelector('[data-map-loading-title]');
    const hintEl = this.mapLoadingOverlay?.querySelector('[data-map-loading-hint]');
    if (titleEl) titleEl.textContent = name;
    if (hintEl) hintEl.textContent = mapId ? `Entering ${name}…` : 'Preparing zone…';

    this.mapLoadingOverlay?.classList.remove('hidden');
    if (this.mapLoadingTimer) clearTimeout(this.mapLoadingTimer);
    this.mapLoadingTimer = setTimeout(() => this.hideMapLoading(), 2500);
  }

  hideMapLoading() {
    this.mapLoadingOverlay?.classList.add('hidden');
    if (this.mapLoadingTimer) {
      clearTimeout(this.mapLoadingTimer);
      this.mapLoadingTimer = null;
    }
  }

  /** @param {number} timestamp */
  loop(timestamp) {
    const game = this.game;
    if (game.worldState && game.displayPlayer) {
      this.inputRouter.handleInput(timestamp);
      this.updateDisplayPlayer();
      this.camera.follow(game.displayPlayer.x, game.displayPlayer.y);
      this.fogOfWar.update(game.worldState.map, game.displayPlayer.x, game.displayPlayer.y);

      const remotePlayers = this.remotePlayerDisplay.sync(game.worldState.players ?? []);

      const renderState = {
        ...game.worldState,
        players: remotePlayers,
        combatFx: this.fxBuffer.getCombatFx(),
        skillFx: this.fxBuffer.getSkillFx(),
        hudLayout: game.hudLayout,
      };

      let hoveredMonsterId = null;
      const mouse = this.input.getMouseScreen();
      if (mouse && game.worldState?.monsters) {
        const world = this.camera.screenToWorld(mouse.screenX, mouse.screenY);
        const visibleMonsters = filterRevealedPositions(
          this.fogOfWar.revealed,
          game.worldState.monsters,
          TILE_SIZE
        );
        hoveredMonsterId = findMonsterAt(visibleMonsters, world.x, world.y)?.id ?? null;
      }

      game.particleSystem.update(timestamp);

      this.renderer.draw(renderState, game.displayPlayer, timestamp, {
        moveTarget: this.pathFollower.target,
        hoveredMonsterId,
        fogOfWar: this.fogOfWar,
        particleSystem: game.particleSystem,
        thinkingNpcId: game.thinkingNpcId,
      });
    }

    requestAnimationFrame((t) => this.loop(t));
  }

  start() {
    requestAnimationFrame((t) => this.loop(t));
  }

  notifyPickupSuccess(state) {
    const game = this.game;
    const pending = game.pendingPickup;
    if (!pending) return;

    const lootStillPresent = (state.loot ?? []).some((drop) => drop.id === pending.lootId);
    if (lootStillPresent) return;

    game.clearPendingPickup();
  }
}
