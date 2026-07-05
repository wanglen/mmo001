const TICK_MS = 50;
const RESPAWN_CHECK_MS = 15000;

export function startGameLoop({ map, playerManager, monsterManager, broadcast }) {
  let lastRespawnCheck = 0;

  setInterval(() => {
    const players = playerManager.getAllEntities();
    if (players.length === 0) return;

    monsterManager.tick(map, players);

    const now = Date.now();
    if (now - lastRespawnCheck >= RESPAWN_CHECK_MS) {
      monsterManager.ensurePopulation(map);
      lastRespawnCheck = now;
    }

    broadcast();
  }, TICK_MS);
}
