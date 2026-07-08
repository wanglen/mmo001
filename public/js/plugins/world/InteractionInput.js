import { findMonsterAt, isInRange } from '/shared/combat.js';
import { findLootAt, isInPickupRange } from '/shared/inventory.js';
import { findPortalAt, isInPortalRange } from '/shared/portals.js';
import { findNpcAt, isNearNpc } from '/shared/npcs.js';
import { MOVE_INTERVAL } from '../core/CoreInput.js';
import { trySetPath, logClientGameEvent } from '../../debug/clientEventLog.js';

/** @param {import('../../game/Game.js').Game} game */
export function handleClick(game) {
  if (game.gamePaused) return;
  const click = game.input.consumeClick();
  if (!click || !game.worldState?.map || !game.displayPlayer) return;

  const world = game.camera.screenToWorld(click.screenX, click.screenY);
  const npc = findNpcAt(game.worldState.npcs ?? [], world.x, world.y);

  if (npc) {
    game.attackTargetId = null;
    game.lootTargetId = null;
    game.portalTargetId = null;
    const origin = game.worldState.player ?? game.displayPlayer;
    const px = origin.x;
    const py = origin.y;
    if (isNearNpc(px, py, npc)) {
      game.npcTargetId = null;
      game.pathFollower.clear();
      game.beginNpcInteraction(npc);
    } else {
      game.npcTargetId = npc.id;
      trySetPath(game, game.worldState.map, px, py, npc.x, npc.y, 'npc_click');
    }
    return;
  }

  const portals = game.worldState.map.portals ?? [];
  const portal = findPortalAt(portals, world.x, world.y);

  if (portal) {
    game.attackTargetId = null;
    game.lootTargetId = null;
    const origin = game.worldState.player ?? game.displayPlayer;
    const px = origin.x;
    const py = origin.y;
    if (isInPortalRange(px, py, portal)) {
      game.portalTargetId = null;
      game.pathFollower.clear();
      game.socketClient.sendUsePortal(portal.id);
    } else {
      game.portalTargetId = portal.id;
      trySetPath(game, game.worldState.map, px, py, portal.x, portal.y, 'portal_click');
    }
    return;
  }

  const loot = findLootAt(game.pickableLoot(), world.x, world.y);

  if (loot) {
    game.lootTargetId = loot.id;
    game.attackTargetId = null;
    game.portalTargetId = null;
    return;
  }

  const monsters = game.worldState.monsters ?? [];
  const target = findMonsterAt(monsters, world.x, world.y);

  if (target) {
    game.attackTargetId = target.id;
    game.lootTargetId = null;
    game.portalTargetId = null;
    const origin = game.worldState.player ?? game.displayPlayer;
    if (origin && !isInRange(origin.x, origin.y, target.x, target.y)) {
      trySetPath(game, game.worldState.map, origin.x, origin.y, target.x, target.y, 'monster_click');
    }
    return;
  }

  const origin = game.worldState.player ?? game.displayPlayer;
  if (!origin) return;

  game.attackTargetId = null;
  game.lootTargetId = null;
  game.portalTargetId = null;
  trySetPath(game, game.worldState.map, origin.x, origin.y, world.x, world.y, 'ground_click');
}

/** @param {import('../../game/Game.js').Game} game @param {number} timestamp */
export function handleNpcChase(game, timestamp) {
  if (!game.npcTargetId || !game.displayPlayer || !game.worldState) return;

  const npc = (game.worldState.npcs ?? []).find((entry) => entry.id === game.npcTargetId);
  if (!npc) {
    game.npcTargetId = null;
    return;
  }

  const origin = game.worldState.player ?? game.displayPlayer;
  if (!origin) return;

  const px = origin.x;
  const py = origin.y;

  if (isNearNpc(px, py, npc)) {
    game.pathFollower.clear();
    game.npcTargetId = null;
    game.beginNpcInteraction(npc);
    return;
  }

  if (timestamp - game.lastChasePathTime >= MOVE_INTERVAL) {
    trySetPath(game, game.worldState.map, px, py, npc.x, npc.y, 'npc_chase');
    game.lastChasePathTime = timestamp;
  }
}

/** @param {import('../../game/Game.js').Game} game @param {number} timestamp */
export function handlePortalChase(game, timestamp) {
  if (!game.portalTargetId || !game.displayPlayer || !game.worldState) return;

  const portal = (game.worldState.map?.portals ?? []).find((entry) => entry.id === game.portalTargetId);
  if (!portal) {
    game.portalTargetId = null;
    return;
  }

  const origin = game.worldState.player ?? game.displayPlayer;
  if (!origin) return;

  const px = origin.x;
  const py = origin.y;

  if (isInPortalRange(px, py, portal)) {
    game.pathFollower.clear();
    game.socketClient.sendUsePortal(portal.id);
    game.portalTargetId = null;
    return;
  }

  if (timestamp - game.lastChasePathTime >= MOVE_INTERVAL) {
    trySetPath(game, game.worldState.map, px, py, portal.x, portal.y, 'portal_chase');
    game.lastChasePathTime = timestamp;
  }
}

/** @param {import('../../game/Game.js').Game} game @param {number} timestamp */
export function handleLootChase(game, timestamp) {
  if (!game.lootTargetId || !game.displayPlayer || !game.worldState) return;

  const drop = (game.worldState.loot ?? []).find((l) => l.id === game.lootTargetId);
  if (!drop || drop.pickupLocked) {
    game.lootTargetId = null;
    return;
  }

  const origin = game.worldState.player ?? game.displayPlayer;
  if (!origin) return;

  const px = origin.x;
  const py = origin.y;

  if (isInPickupRange(px, py, drop.x, drop.y)) {
    game.pathFollower.clear();
    game.socketClient.sendPickup(drop.id);
    game.audio.playSfx('pickup');
    game.lootTargetId = null;
    return;
  }

  if (timestamp - game.lastChasePathTime >= MOVE_INTERVAL) {
    trySetPath(game, game.worldState.map, px, py, drop.x, drop.y, 'loot_chase');
    game.lastChasePathTime = timestamp;
  }
}
