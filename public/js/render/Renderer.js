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
import { filterRevealedPositions, isPositionRevealed } from '/shared/fog.js';
import { getZoneAtPixel } from '/shared/zones.js';
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
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  draw(worldState, displayPlayer, rafTimestamp, overlays = {}) {
    const { map, players, monsters = [], loot = [], npcs = [], skillFx = [], combatFx = [] } = worldState;
    const portals = map?.portals ?? [];
    const { moveTarget = null, hoveredMonsterId = null, fogOfWar = null } = overlays;
    const revealed = fogOfWar?.revealed ?? null;
    const visibleMonsters = filterRevealedPositions(revealed, monsters, TILE_SIZE);
    const visibleLoot = filterRevealedPositions(revealed, loot, TILE_SIZE);
    const visiblePlayers = filterRevealedPositions(revealed, players, TILE_SIZE);
    const visibleCombatFx = revealed
      ? combatFx.filter((fx) => isPositionRevealed(revealed, fx.x, fx.y, TILE_SIZE))
      : combatFx;
    const visibleSkillFx = revealed
      ? skillFx.filter((fx) => isPositionRevealed(revealed, fx.x, fx.y, TILE_SIZE))
      : skillFx;

    const now = Date.now();
    const hitFlashes = this.combatFxRenderer.getHitFlashes(visibleCombatFx, now);

    this.ctx.fillStyle = '#0c0e14';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.mapRenderer.draw(this.ctx, map, this.camera, this.canvas.width, this.canvas.height);

    this.portalRenderer.draw(this.ctx, portals, this.camera, revealed);

    if (fogOfWar && map) {
      this.fogRenderer.draw(
        this.ctx,
        map,
        this.camera,
        fogOfWar,
        this.canvas.width,
        this.canvas.height
      );
    }

    const anyMoving = visiblePlayers.some((p) =>
      p.id === displayPlayer.id ? displayPlayer.moving : p.moving
    );
    this.spriteManager.updateAnim(rafTimestamp, anyMoving);

    const anyMonsterMoving = visibleMonsters.some((m) => m.moving);
    this.monsterRenderer.updateAnim(rafTimestamp, anyMonsterMoving);
    this.monsterRenderer.draw(
      this.ctx,
      visibleMonsters,
      this.camera,
      hitFlashes,
      hoveredMonsterId
    );
    this.lootRenderer.draw(this.ctx, visibleLoot, this.camera, rafTimestamp);
    this.npcRenderer.draw(this.ctx, npcs, this.camera);

    if (moveTarget && (!revealed || isPositionRevealed(revealed, moveTarget.x, moveTarget.y, TILE_SIZE))) {
      this.drawMoveTarget(moveTarget);
    }

    for (const player of visiblePlayers) {
      const renderPlayer = player.id === displayPlayer.id
        ? {
            ...player,
            x: displayPlayer.x,
            y: displayPlayer.y,
            moving: displayPlayer.moving,
            facing: displayPlayer.facing ?? player.facing,
            attacking: displayPlayer.attacking ?? player.attacking,
          }
        : player;
      this.spriteManager.draw(this.ctx, renderPlayer, this.camera);
    }

    this.townRecallRenderer.draw(this.ctx, displayPlayer, this.camera, rafTimestamp);

    this.skillEffectRenderer.draw(this.ctx, visibleSkillFx, this.camera, now);
    this.combatFxRenderer.draw(this.ctx, visibleCombatFx, this.camera, now);

    const zone = map ? getZoneAtPixel(map, displayPlayer.x, displayPlayer.y) : null;
    this.minimap.draw(this.ctx, map, displayPlayer, fogOfWar, this.canvas.width);
    this.playerHud.draw(
      this.ctx,
      displayPlayer,
      zone,
      map,
      this.canvas.width,
      this.canvas.height,
      worldState.version
    );
  }

  drawMoveTarget(target) {
    const zoom = this.camera.zoom ?? 1;
    const screen = this.camera.worldToScreen(target.x, target.y);

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.lineWidth = 2 * zoom;
    this.ctx.beginPath();
    this.ctx.arc(screen.x, screen.y, 8 * zoom, 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.beginPath();
    this.ctx.arc(screen.x, screen.y, 3 * zoom, 0, Math.PI * 2);
    this.ctx.fill();
  }
}
