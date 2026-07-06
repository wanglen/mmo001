import { createPlayer, createPlayerFromSave } from './Player.js';
import { DEFAULT_MAP_ID } from '../../shared/worldMaps.js';

export class PlayerManager {
  constructor() {
    this.players = new Map();
  }

  create({ id, name, characterClass, spawn, map, saved = null, mapId = DEFAULT_MAP_ID, forceSpawn = false }) {
    const player = saved
      ? createPlayerFromSave({ id, name, characterClass, spawn, map, saved, mapId, forceSpawn })
      : createPlayer({ id, name, characterClass, spawn, mapId });
    this.players.set(id, player);
    return player;
  }

  get(id) {
    return this.players.get(id);
  }

  update(id, updates) {
    const player = this.players.get(id);
    if (!player) return null;
    Object.assign(player, updates);
    return player;
  }

  remove(id) {
    const player = this.players.get(id);
    this.players.delete(id);
    return player ?? null;
  }

  getAll() {
    return Array.from(this.players.values()).map((p) => p.toJSON());
  }

  getAllEntities() {
    return Array.from(this.players.values());
  }

  findByName(name) {
    const needle = (name ?? '').trim().toLowerCase();
    if (!needle) return null;
    return this.getAllEntities().find((entry) => entry.name.toLowerCase() === needle) ?? null;
  }
}
