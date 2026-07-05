import { MAP_ID } from './worldMaps.js';

/** Cast time before recall teleports the player to town. */
export const TOWN_RECALL_CAST_MS = 6000;

export const TOWN_RECALL_TARGET_MAP_ID = MAP_ID.TOWN;

export function isTownHubMap(map) {
  return map?.mapId === MAP_ID.TOWN;
}

export function townRecallProgress(castMs, castDuration = TOWN_RECALL_CAST_MS) {
  if (!Number.isFinite(castMs) || castMs <= 0) return 0;
  return Math.min(1, castMs / castDuration);
}

/** @deprecated Use townRecallProgress */
export const TELEPORT_HOLD_MS = TOWN_RECALL_CAST_MS;

/** @deprecated Use townRecallProgress */
export function teleportChargeProgress(chargeMs, holdMs = TOWN_RECALL_CAST_MS) {
  return townRecallProgress(chargeMs, holdMs);
}
