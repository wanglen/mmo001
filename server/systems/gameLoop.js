import { isInCombat, tickMpRegen } from '../../shared/regen.js';

const TICK_MS = 50;
const RESPAWN_CHECK_MS = 15000;

export function startGameLoop({ map, playerManager, monsterManager, broadcast }) {
  let lastRespawnCheck = 0;

  setInterval(() => {
    const players = playerManager.getAllEntities();
    if (players.length === 0) return;

    const now = Date.now();
    monsterManager.tick(map, players, now);

    const deltaSec = TICK_MS / 1000;
    for (const player of players) {
      if (player.dead) continue;
      tickMpRegen(player, player.characterClass, deltaSec, {
        inCombat: isInCombat(player, now),
      });
    }

    if (now - lastRespawnCheck >= RESPAWN_CHECK_MS) {
      monsterManager.ensurePopulation(map);
      lastRespawnCheck = now;
    }

    broadcast();
  }, TICK_MS);
}
