import { RARITY } from '../../items.js';
import { isGem } from './gems.js';

/**
 * @param {string} rarity
 * @param {() => number} [random]
 * @returns {number}
 */
export function rollSocketCount(rarity, random = Math.random) {
  if (rarity === RARITY.COMMON) return 0;
  if (rarity === RARITY.MAGIC) return random() < 0.3 ? 1 : 0;
  if (rarity === RARITY.RARE) return 1 + (random() < 0.5 ? 1 : 0);
  if (rarity === RARITY.UNIQUE) return 2 + (random() < 0.4 ? 1 : 0);
  return 0;
}

/** @param {number} count */
export function createEmptySockets(count) {
  return Array.from({ length: count }, () => ({ gem: null }));
}

/** @param {object} item */
export function getEmptySocketIndex(item) {
  const sockets = item?.sockets ?? [];
  return sockets.findIndex((socket) => !socket.gem);
}

/**
 * @param {object} item
 * @param {object} gem
 * @param {{ socketIndex?: number }} [options]
 */
export function socketGemIntoItem(item, gem, options = {}) {
  if (!item?.sockets?.length) return { ok: false, reason: 'no_sockets' };
  if (!isGem(gem)) return { ok: false, reason: 'not_gem' };

  const requestedIndex = options.socketIndex;
  if (Number.isInteger(requestedIndex)) {
    if (requestedIndex < 0 || requestedIndex >= item.sockets.length) {
      return { ok: false, reason: 'invalid_socket' };
    }

    const socket = item.sockets[requestedIndex];
    const replacedGem = socket.gem ? { ...socket.gem, stats: { ...socket.gem.stats } } : null;
    item.sockets[requestedIndex] = { gem: { ...gem, stats: { ...gem.stats } } };
    return {
      ok: true,
      socketIndex: requestedIndex,
      replacedGem,
      replaced: !!replacedGem,
    };
  }

  const index = getEmptySocketIndex(item);
  if (index < 0) return { ok: false, reason: 'sockets_full' };

  item.sockets[index] = { gem: { ...gem, stats: { ...gem.stats } } };
  return { ok: true, socketIndex: index, replacedGem: null, replaced: false };
}

/** @param {object[]} sockets */
export function getSocketStatBonuses(sockets = []) {
  const stats = {};
  for (const socket of sockets) {
    if (!socket?.gem?.stats) continue;
    for (const [stat, value] of Object.entries(socket.gem.stats)) {
      stats[stat] = (stats[stat] ?? 0) + value;
    }
  }
  return stats;
}
