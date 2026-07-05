import { MapRenderer } from './MapRenderer.js';
import { CharacterRenderer } from './CharacterRenderer.js';
import { MonsterRenderer } from './MonsterRenderer.js';
import { LootRenderer } from './LootRenderer.js';
import { SkillEffectRenderer } from './SkillEffectRenderer.js';
import { CombatFxRenderer } from './CombatFxRenderer.js';
import { FogRenderer } from './FogRenderer.js';
import { PlayerHud } from '../ui/PlayerHud.js';
import { filterRevealedPositions, isPositionRevealed } from '/shared/fog.js';
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
    this.playerHud = new PlayerHud();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  draw(worldState, displayPlayer, rafTimestamp, overlays = {}) {
    const { map, players, monsters = [], loot = [], skillFx = [], combatFx = [] } = worldState;
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

    this.skillEffectRenderer.draw(this.ctx, visibleSkillFx, this.camera, now);
    this.combatFxRenderer.draw(this.ctx, visibleCombatFx, this.camera, now);

    this.playerHud.draw(this.ctx, displayPlayer);
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
