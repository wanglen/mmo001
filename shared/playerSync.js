import { getEffectiveCombatStats } from './inventory.js';

/** Fields synced to other clients for the same map (no inventory or quests). */
export function toPublicPlayerJSON(player, now = Date.now()) {
  const effective = getEffectiveCombatStats(player, player.equipment ?? {});

  return {
    id: player.id,
    name: player.name,
    characterClass: player.characterClass,
    mapId: player.mapId,
    x: player.x,
    y: player.y,
    direction: player.direction,
    facing: player.facing,
    moving: !!player.moving,
    attacking: !!player.attacking,
    dead: !!player.dead,
    level: player.level ?? 1,
    hp: player.hp,
    maxHp: effective.maxHp,
    townRecallCasting: !!player.townRecallCasting,
    townRecallCastMs: player.townRecallCasting ? (player.townRecallCastMs ?? 0) : 0,
    lastMoveAt: player.lastMoveAt ?? 0,
    lastAttackAt: player.lastAttackAt ?? 0,
    updatedAt: now,
  };
}

/** Idle animation when no move packet recently (server tick). */
export const PLAYER_MOVE_IDLE_MS = 120;

export function applyPlayerMoveIdle(players, now = Date.now()) {
  for (const player of players) {
    if (!player.moving) continue;
    if (now - (player.lastMoveAt ?? 0) > PLAYER_MOVE_IDLE_MS) {
      player.moving = false;
    }
  }
}

export function serializeRemotePlayers(players, viewerId, now = Date.now()) {
  return players
    .filter((entry) => entry.id !== viewerId)
    .map((entry) => toPublicPlayerJSON(entry, now));
}
