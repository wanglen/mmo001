import { getEmptySocketIndex } from './sockets.js';

function appendSocketTargets(targets, item, kind, ref) {
  if (!item?.sockets?.length) return;

  const emptyIndex = getEmptySocketIndex(item);
  if (emptyIndex >= 0) {
    targets.push({
      kind,
      ...ref,
      label: item.name,
      socketIndex: null,
      replace: false,
    });
  }

  item.sockets.forEach((socket, socketIndex) => {
    if (!socket?.gem) return;
    targets.push({
      kind,
      ...ref,
      label: item.name,
      socketIndex,
      occupiedGemName: socket.gem.name,
      replace: true,
    });
  });
}

/** @param {object} player */
export function listSocketTargets(player) {
  const targets = [];

  (player.inventory ?? []).forEach((item, index) => {
    appendSocketTargets(targets, item, 'inventory', { index });
  });

  for (const [slot, item] of Object.entries(player.equipment ?? {})) {
    appendSocketTargets(targets, item, 'equip', { slot });
  }

  return targets;
}
