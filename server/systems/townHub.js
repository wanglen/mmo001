import { tileToPixel } from '../map/collision.js';
import {
  isTownHubMap,
  TOWN_RECALL_CAST_MS,
  TOWN_RECALL_TARGET_MAP_ID,
} from '../../shared/townHub.js';
import { refreshPlayerDerivedStats } from '../../shared/inventory.js';

export function restoreVitalityInTown(player, map) {
  if (!isTownHubMap(map) || player.dead) return false;

  refreshPlayerDerivedStats(player, player.equipment);
  let changed = false;
  if (player.hp < player.maxHp) {
    player.hp = player.maxHp;
    changed = true;
  }
  if (player.mp < player.maxMp) {
    player.mp = player.maxMp;
    changed = true;
  }
  return changed;
}

export function cancelTownRecall(player) {
  if (!player?.townRecallCasting) return false;
  player.townRecallCasting = false;
  player.townRecallCastMs = 0;
  return true;
}

export function interruptTownRecall(player) {
  return cancelTownRecall(player);
}

/**
 * Begin a 6-second recall cast to town.
 * @returns {{ ok: true } | { ok: false, reason: string }}
 */
export function startTownRecall(player, map) {
  if (!player || player.dead) return { ok: false, reason: 'dead' };
  if (isTownHubMap(map)) return { ok: false, reason: 'already_in_town' };
  if (player.townRecallCasting) return { ok: false, reason: 'already_casting' };

  player.townRecallCasting = true;
  player.townRecallCastMs = 0;
  player.moving = false;
  return { ok: true };
}

/**
 * Advance recall cast; teleports when complete.
 * @returns {{ teleported: boolean }}
 */
export function tickTownRecall(player, map, world, deltaMs) {
  if (!player.townRecallCasting) {
    player.townRecallCastMs = 0;
    return { teleported: false };
  }

  if (player.dead || isTownHubMap(map)) {
    cancelTownRecall(player);
    return { teleported: false };
  }

  player.townRecallCastMs = (player.townRecallCastMs ?? 0) + deltaMs;
  if (player.townRecallCastMs < TOWN_RECALL_CAST_MS) {
    return { teleported: false };
  }

  teleportToTown({ world, player });
  return { teleported: true };
}

export function teleportToTown({ world, player }) {
  const targetMap = world.getMap(TOWN_RECALL_TARGET_MAP_ID);
  if (!targetMap) return { ok: false, reason: 'missing_town' };

  const spawnPos = tileToPixel(targetMap.spawn.x, targetMap.spawn.y);
  player.mapId = TOWN_RECALL_TARGET_MAP_ID;
  player.x = spawnPos.x;
  player.y = spawnPos.y;
  player.moving = false;
  player.attacking = false;
  player.townRecallCasting = false;
  player.townRecallCastMs = 0;

  return { ok: true, mapId: player.mapId };
}

export function tickTownHub(player, map, world, deltaMs) {
  restoreVitalityInTown(player, map);
  return tickTownRecall(player, map, world, deltaMs);
}

export function tickPlayerTownSystems(player, map, world, deltaMs) {
  if (isTownHubMap(map)) {
    restoreVitalityInTown(player, map);
  }
  return tickTownRecall(player, map, world, deltaMs);
}
