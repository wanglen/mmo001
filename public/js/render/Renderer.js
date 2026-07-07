import { MapRenderer } from './MapRenderer.js';
import { CharacterRenderer } from './CharacterRenderer.js';
import { MonsterRenderer } from './MonsterRenderer.js';
import { LootRenderer } from './LootRenderer.js';
import { SkillEffectRenderer } from './SkillEffectRenderer.js';
import { CombatFxRenderer } from './CombatFxRenderer.js';
import { FogRenderer } from './FogRenderer.js';
import { PortalRenderer } from './PortalRenderer.js';
import { NpcRenderer } from './NpcRenderer.js';
import { TownRecallRenderer } from './TownRecallRenderer.js';
import { PlayerHud } from '../ui/PlayerHud.js';
import { Minimap } from '../ui/Minimap.js';
import {
  createDefaultLayers,
  filterRevealedPositions,
  isPositionRevealed,
} from './createDefaultLayers.js';
import { TILE_SIZE } from '../config.js';

export class Renderer {
  constructor(canvas, camera) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.camera = camera;
    this.mapRenderer = new MapRenderer();
    this.spriteManager = new CharacterRenderer();
    this.monsterRenderer = new MonsterRenderer();
    this.lootRenderer = new LootRenderer();
    this.skillEffectRenderer = new SkillEffectRenderer();
    this.combatFxRenderer = new CombatFxRenderer();
    this.fogRenderer = new FogRenderer();
    this.portalRenderer = new PortalRenderer();
    this.npcRenderer = new NpcRenderer();
    this.townRecallRenderer = new TownRecallRenderer();
    this.playerHud = new PlayerHud();
    this.minimap = new Minimap();
    /** @type {Array<{ id: string, order?: number, draw: Function }>} */
    this.layers = createDefaultLayers({
      mapRenderer: this.mapRenderer,
      portalRenderer: this.portalRenderer,
      fogRenderer: this.fogRenderer,
      spriteManager: this.spriteManager,
      monsterRenderer: this.monsterRenderer,
      lootRenderer: this.lootRenderer,
      npcRenderer: this.npcRenderer,
      townRecallRenderer: this.townRecallRenderer,
      skillEffectRenderer: this.skillEffectRenderer,
      combatFxRenderer: this.combatFxRenderer,
      playerHud: this.playerHud,
      minimap: this.minimap,
      drawMoveTarget: () => {},
    });
  }

  /**
   * Register or replace a render layer (ordered by `order`, then registration).
   * @param {{ id: string, order?: number, draw: (ctx: CanvasRenderingContext2D, frame: object, camera: object, canvas: HTMLCanvasElement) => void }} layer
   */
  registerLayer(layer) {
    const index = this.layers.findIndex((entry) => entry.id === layer.id);
    if (index >= 0) {
      this.layers[index] = layer;
    } else {
      this.layers.push(layer);
    }
    this.layers.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  draw(worldState, displayPlayer, rafTimestamp, overlays = {}) {
    const { map, players, monsters = [], loot = [], npcs = [], skillFx = [], combatFx = [] } =
      worldState;
    const portals = map?.portals ?? [];
    const { moveTarget = null, hoveredMonsterId = null, fogOfWar = null, particleSystem = null } =
      overlays;
    const revealed = fogOfWar?.revealed ?? null;
    const visibleMonsters = filterRevealedPositions(revealed, monsters, TILE_SIZE);
    const visibleLoot = filterRevealedPositions(revealed, loot, TILE_SIZE);
    const remotePlayers = players ?? [];
    const visibleCombatFx = revealed
      ? combatFx.filter((fx) => isPositionRevealed(revealed, fx.x, fx.y, TILE_SIZE))
      : combatFx;
    const visibleSkillFx = revealed
      ? skillFx.filter((fx) => isPositionRevealed(revealed, fx.x, fx.y, TILE_SIZE))
      : skillFx;

    const now = Date.now();
    const hitFlashes = this.combatFxRenderer.getHitFlashes(visibleCombatFx, now);

    const anyMoving = displayPlayer.moving || remotePlayers.some((p) => p.moving);
    this.spriteManager.updateAnim(rafTimestamp, anyMoving);

    const anyMonsterMoving = visibleMonsters.some((m) => m.moving);
    this.monsterRenderer.updateAnim(rafTimestamp, anyMonsterMoving);

    const frame = {
      map,
      portals,
      npcs,
      displayPlayer,
      remotePlayers,
      visibleMonsters,
      visibleLoot,
      visibleCombatFx,
      visibleSkillFx,
      hitFlashes,
      hoveredMonsterId,
      moveTarget,
      fogOfWar,
      revealed,
      particleSystem,
      rafTimestamp,
      now,
      version: worldState.version,
    };

    for (const layer of this.layers) {
      layer.draw(this.ctx, frame, this.camera, this.canvas);
    }
  }
}
