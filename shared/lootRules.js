import { isWithinPartyXpRange, PARTY_XP_SHARE_RANGE } from './social.js';

/** Loot is reserved for killer + nearby party for this duration (ms). */
export const LOOT_LOCK_MS = 30_000;

/**
 * Player ids allowed to pick up a drop while the lock is active.
 * Uses the same map + range rules as party XP sharing.
 */
export function getLootEligiblePlayerIds(killer, partyMemberIds, allPlayers, range = PARTY_XP_SHARE_RANGE) {
  if (!killer) return [];

  const eligible = new Set([killer.id]);
  if (!partyMemberIds?.length || partyMemberIds.length <= 1) {
    return [killer.id];
  }

  for (const memberId of partyMemberIds) {
    if (memberId === killer.id) continue;
    const member = allPlayers.find((entry) => entry.id === memberId);
    if (!member || member.dead) continue;
    if (member.mapId !== killer.mapId) continue;
    if (!isWithinPartyXpRange(killer.x, killer.y, member.x, member.y, range)) continue;
    eligible.add(memberId);
  }

  return [...eligible];
}

export function canPickupLoot(drop, playerId, now = Date.now()) {
  if (!drop) return false;
  if (!drop.eligiblePlayerIds?.length) return true;
  if (now >= (drop.freeForAllAt ?? 0)) return true;
  return drop.eligiblePlayerIds.includes(playerId);
}

export function buildLootDropMeta(killer, partyMemberIds, allPlayers, now = Date.now()) {
  const eligiblePlayerIds = getLootEligiblePlayerIds(killer, partyMemberIds, allPlayers);
  return {
    killerId: killer.id,
    eligiblePlayerIds,
    freeForAllAt: now + LOOT_LOCK_MS,
  };
}

export function serializeLootForClient(drop, viewerId, now = Date.now()) {
  const locked = !canPickupLoot(drop, viewerId, now);
  return {
    id: drop.id,
    x: drop.x,
    y: drop.y,
    item: drop.item,
    pickupLocked: locked,
  };
}

/** System chat line when loot is added to inventory. */
export function formatPickupMessage(itemName) {
  const name = typeof itemName === 'string' && itemName.trim() ? itemName.trim() : 'Item';
  return `Picked up ${name}`;
}
