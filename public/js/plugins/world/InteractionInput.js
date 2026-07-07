import { findMonsterAt } from '/shared/combat.js';
import { findLootAt, isInPickupRange } from '/shared/inventory.js';
import { findPortalAt, isInPortalRange } from '/shared/portals.js';
import { findNpcAt, isNearNpc } from '/shared/npcs.js';
import { MOVE_INTERVAL } from '../core/CoreInput.js';

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
    const px = game.displayPlayer.x;
    const py = game.displayPlayer.y;
    if (isNearNpc(px, py, npc)) {
      game.npcTargetId = null;
      game.pathFollower.clear();
      game.beginNpcInteraction(npc);
    } else {
      game.npcTargetId = npc.id;
      game.pathFollower.setPath(game.worldState.map, px, py, npc.x, npc.y);
    }
    return;
  }

  const portals = game.worldState.map.portals ?? [];
  const portal = findPortalAt(portals, world.x, world.y);

  if (portal) {
    game.attackTargetId = null;
    game.lootTargetId = null;
    const px = game.displayPlayer.x;
    const py = game.displayPlayer.y;
    if (isInPortalRange(px, py, portal)) {
      game.pathFollower.clear();
      game.socketClient.sendUsePortal(portal.id);
    } else {
      game.pathFollower.setPath(game.worldState.map, px, py, portal.x, portal.y);
    }
    return;
  }

  const loot = findLootAt(game.pickableLoot(), world.x, world.y);

  if (loot) {
    game.lootTargetId = loot.id;
    game.attackTargetId = null;
    return;
  }

  const monsters = game.worldState.monsters ?? [];
  const target = findMonsterAt(monsters, world.x, world.y);

  if (target) {
    game.attackTargetId = target.id;
    game.lootTargetId = null;
    return;
  }

  game.attackTargetId = null;
  game.lootTargetId = null;
  game.pathFollower.setPath(
    game.worldState.map,
    game.displayPlayer.x,
    game.displayPlayer.y,
    world.x,
    world.y
  );
}

/** @param {import('../../game/Game.js').Game} game @param {number} timestamp */
export function handleNpcChase(game, timestamp) {
  if (!game.npcTargetId || !game.displayPlayer || !game.worldState) return;

  const npc = (game.worldState.npcs ?? []).find((entry) => entry.id === game.npcTargetId);
  if (!npc) {
    game.npcTargetId = null;
    return;
  }

  const px = game.displayPlayer.x;
  const py = game.displayPlayer.y;

  if (isNearNpc(px, py, npc)) {
    game.pathFollower.clear();
    game.npcTargetId = null;
    game.beginNpcInteraction(npc);
    return;
  }

  if (timestamp - game.lastChasePathTime >= MOVE_INTERVAL) {
    game.pathFollower.setPath(game.worldState.map, px, py, npc.x, npc.y);
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

  const px = game.displayPlayer.x;
  const py = game.displayPlayer.y;

  if (isInPickupRange(px, py, drop.x, drop.y)) {
    game.pathFollower.clear();
    game.socketClient.sendPickup(drop.id);
    game.lootTargetId = null;
    return;
  }

  if (timestamp - game.lastChasePathTime >= MOVE_INTERVAL) {
    game.pathFollower.setPath(game.worldState.map, px, py, drop.x, drop.y);
    game.lastChasePathTime = timestamp;
  }
}
