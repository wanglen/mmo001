/** @type {number} */
let currentTick = 0;

/** @param {number} tick */
export function setServerTick(tick) {
  currentTick = tick;
}

export function getServerTick() {
  return currentTick;
}
