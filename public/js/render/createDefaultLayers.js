import { filterRevealedPositions, isPositionRevealed } from '/shared/fog.js';
import { getZoneAtPixel } from '/shared/zones.js';
import { TILE_SIZE } from '../config.js';
import { createHudLayer } from './layers/HudLayer.js';
import { createMinimapLayer } from './layers/MinimapLayer.js';

/**
 * Build default world + UI render layers for the canvas renderer.
 * @param {object} deps
 */
export function createDefaultLayers(deps) {
  const {
    mapRenderer,
    portalRenderer,
    fogRenderer,
    spriteManager,
    monsterRenderer,
    lootRenderer,
    npcRenderer,
    townRecallRenderer,
    skillEffectRenderer,
    combatFxRenderer,
    playerHud,
    minimap,
    drawMoveTarget,
  } = deps;

  return [
    {
      id: 'background',
      order: 0,
      draw(ctx, frame, camera, canvas) {
        ctx.fillStyle = '#0c0e14';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      },
    },
    {
      id: 'map',
      order: 10,
      draw(ctx, frame, camera, canvas) {
        mapRenderer.draw(ctx, frame.map, camera, canvas.width, canvas.height);
      },
    },
    {
      id: 'portals',
      order: 20,
      draw(ctx, frame, camera) {
        portalRenderer.draw(ctx, frame.portals, camera, frame.revealed);
      },
    },
    {
      id: 'fog',
      order: 30,
      draw(ctx, frame, camera, canvas) {
        if (frame.fogOfWar && frame.map) {
          fogRenderer.draw(
            ctx,
            frame.map,
            camera,
            frame.fogOfWar,
            canvas.width,
            canvas.height
          );
        }
      },
    },
    {
      id: 'monsters',
      order: 40,
      draw(ctx, frame, camera) {
        monsterRenderer.draw(
          ctx,
          frame.visibleMonsters,
          camera,
          frame.hitFlashes,
          frame.hoveredMonsterId
        );
      },
    },
    {
      id: 'loot',
      order: 50,
      draw(ctx, frame, camera) {
        lootRenderer.draw(ctx, frame.visibleLoot, camera, frame.rafTimestamp);
      },
    },
    {
      id: 'npcs',
      order: 60,
      draw(ctx, frame, camera) {
        npcRenderer.draw(ctx, frame.npcs, camera);
      },
    },
    {
      id: 'move-target',
      order: 70,
      draw(ctx, frame, camera) {
        if (frame.moveTarget) drawMoveTarget(ctx, camera, frame.moveTarget, frame.revealed);
      },
    },
    {
      id: 'remote-players',
      order: 80,
      draw(ctx, frame, camera) {
        for (const player of frame.remotePlayers) {
          spriteManager.draw(ctx, player, camera);
        }
      },
    },
    {
      id: 'local-player',
      order: 90,
      draw(ctx, frame, camera) {
        spriteManager.draw(ctx, frame.displayPlayer, camera);
      },
    },
    {
      id: 'town-recall',
      order: 95,
      draw(ctx, frame, camera) {
        townRecallRenderer.draw(ctx, frame.displayPlayer, camera, frame.rafTimestamp);
      },
    },
    {
      id: 'skill-fx',
      order: 100,
      draw(ctx, frame, camera) {
        skillEffectRenderer.draw(ctx, frame.visibleSkillFx, camera, frame.now);
      },
    },
    {
      id: 'combat-fx',
      order: 110,
      draw(ctx, frame, camera) {
        combatFxRenderer.draw(ctx, frame.visibleCombatFx, camera, frame.now);
      },
    },
    {
      id: 'particles',
      order: 115,
      draw(ctx, frame, camera) {
        frame.particleSystem?.draw(ctx, camera);
      },
    },
    createMinimapLayer(minimap),
    createHudLayer(playerHud),
  ];
}

/** @param {CanvasRenderingContext2D} ctx @param {object} camera @param {object} target @param {Set<string> | null} revealed */
function drawMoveTarget(ctx, camera, target, revealed) {
  if (revealed && !isPositionRevealed(revealed, target.x, target.y, TILE_SIZE)) return;

  const zoom = camera.zoom ?? 1;
  const screen = camera.worldToScreen(target.x, target.y);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 2 * zoom;
  ctx.beginPath();
  ctx.arc(screen.x, screen.y, 8 * zoom, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.beginPath();
  ctx.arc(screen.x, screen.y, 3 * zoom, 0, Math.PI * 2);
  ctx.fill();
}

export { getZoneAtPixel, filterRevealedPositions, isPositionRevealed };
