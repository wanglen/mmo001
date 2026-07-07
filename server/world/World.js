import { MonsterManager } from '../entities/MonsterManager.js';
import { LootManager } from '../entities/LootManager.js';
import { MAP_ID, WORLD_MAP_IDS } from '../../shared/worldMaps.js';
import {
  attachWorldPortals,
  generateDungeonMap,
  generateTownMap,
  generateWildernessMap,
} from './worldMapFactory.js';

export class World {
  constructor(mapsById) {
    this.maps = mapsById;
    this.monsterManagers = new Map();
    this.lootManagers = new Map();

    for (const mapId of WORLD_MAP_IDS) {
      const map = this.maps.get(mapId);
      const monsterManager = new MonsterManager();
      const lootManager = new LootManager();
      if (mapId !== MAP_ID.TOWN) {
        monsterManager.spawnOnMap(map);
      }
      this.monsterManagers.set(mapId, monsterManager);
      this.lootManagers.set(mapId, lootManager);
    }
  }

  static create() {
    const town = generateTownMap();
    const wilderness = generateWildernessMap();
    const dungeon = generateDungeonMap();
    attachWorldPortals(town, wilderness, dungeon);

    const mapsById = new Map([
      [MAP_ID.TOWN, town],
      [MAP_ID.WILDERNESS, wilderness],
      [MAP_ID.DUNGEON, dungeon],
    ]);

    return new World(mapsById);
  }

  getMap(mapId) {
    return this.maps.get(mapId);
  }

  getMonsterManager(mapId) {
    return this.monsterManagers.get(mapId);
  }

  getLootManager(mapId) {
    return this.lootManagers.get(mapId);
  }

  getContext(mapId) {
    return {
      mapId,
      map: this.getMap(mapId),
      monsterManager: this.getMonsterManager(mapId),
      lootManager: this.getLootManager(mapId),
    };
  }

  getContextForPlayer(player) {
    const mapId = player?.mapId ?? MAP_ID.TOWN;
    return this.getContext(mapId);
  }

  mapIdsWithPlayers(players) {
    return [...new Set(players.map((p) => p.mapId ?? MAP_ID.TOWN))];
  }
}

export function createWorld() {
  return World.create();
}
