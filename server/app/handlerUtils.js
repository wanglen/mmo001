import { facingFromTarget } from '../../shared/aim.js';
import { isPlayerAlive } from '../../shared/playerLife.js';
import { DEFAULT_MAP_ID } from '../../shared/worldMaps.js';

export function sanitizePlayerName(name) {
  return (name || '').trim().slice(0, 20);
}

export function playerMapId(player) {
  return player?.mapId ?? DEFAULT_MAP_ID;
}

export function getLivingPlayer(playerManager, socketId) {
  const player = playerManager.get(socketId);
  if (!player || !isPlayerAlive(player)) return null;
  return player;
}

export function getPlayerContext(world, player) {
  return world.getContextForPlayer(player);
}

export async function persistPlayers(characterStore, playerManager, playerIds = []) {
  for (const playerId of playerIds) {
    const entry = playerManager.get(playerId);
    if (entry) await characterStore.save(entry);
  }
}

export async function persistPlayer(characterStore, player) {
  if (player) await characterStore.save(player);
}

export function updatePlayerAim(player, x, y) {
  if (typeof x !== 'number' || typeof y !== 'number' || !Number.isFinite(x) || !Number.isFinite(y)) {
    return false;
  }

  player.aimX = x;
  player.aimY = y;

  const facing = facingFromTarget(player.x, player.y, x, y);
  if (facing) player.facing = facing;

  return true;
}
