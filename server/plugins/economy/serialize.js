/** @param {import('../players/Player.js').Player} player */
export function serializeEconomyPlayer(player) {
  return {
    gold: player.gold ?? 0,
  };
}
