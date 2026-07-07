import { getEmptySocketIndex } from './sockets.js';

/** @param {object} player */
export function listSocketTargets(player) {
  const targets = [];

  (player.inventory ?? []).forEach((item, index) => {
    if (item?.sockets && getEmptySocketIndex(item) >= 0) {
      targets.push({ kind: 'inventory', index, label: item.name });
    }
  });

  for (const [slot, item] of Object.entries(player.equipment ?? {})) {
    if (item?.sockets && getEmptySocketIndex(item) >= 0) {
      targets.push({ kind: 'equip', slot, label: item.name });
    }
  }

  return targets;
}
