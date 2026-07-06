import { isInCombat, tickMpRegen } from '../../shared/regen.js';
import { MAP_ID } from '../../shared/worldMaps.js';
import { isTownHubMap } from '../../shared/townHub.js';
import { applyPlayerMoveIdle } from '../../shared/playerSync.js';
import { tickPlayerTownSystems } from './townHub.js';

const TICK_MS = 50;
const RESPAWN_CHECK_MS = 15000;

export function startGameLoop({ world, playerManager, characterStore, broadcast }) {
  let lastRespawnCheck = 0;

  setInterval(async () => {
    const players = playerManager.getAllEntities();
    if (players.length === 0) return;

    const now = Date.now();
    const teleportedIds = new Set();

    for (const mapId of world.mapIdsWithPlayers(players)) {
      const mapPlayers = players.filter((player) => (player.mapId ?? MAP_ID.TOWN) === mapId);
      const { map, monsterManager } = world.getContext(mapId);
      monsterManager.tick(map, mapPlayers, now);
    }

    for (const player of players) {
      if (player.dead) continue;

      const { map } = world.getContextForPlayer(player);
      const result = tickPlayerTownSystems(player, map, world, TICK_MS);
      if (result.teleported) {
        teleportedIds.add(player.id);
        if (characterStore) await characterStore.save(player);
      }

      if (!isTownHubMap(map) && !player.townRecallCasting) {
        const deltaSec = TICK_MS / 1000;
        tickMpRegen(player, player.characterClass, deltaSec, {
          inCombat: isInCombat(player, now),
        });
      }
    }

    if (now - lastRespawnCheck >= RESPAWN_CHECK_MS) {
      lastRespawnCheck = now;
      for (const mapId of world.mapIdsWithPlayers(players)) {
        if (mapId === MAP_ID.TOWN) continue;
        const { map, monsterManager } = world.getContext(mapId);
        monsterManager.ensurePopulation(map);
      }
    }

    applyPlayerMoveIdle(players, now);

    broadcast({ teleportedIds: teleportedIds.size > 0 ? teleportedIds : null });
  }, TICK_MS);
}
