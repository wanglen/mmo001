import { createPlayer, createPlayerFromSave } from './Player.js';

export class PlayerManager {
  constructor() {
    this.players = new Map();
  }

  create({ id, name, characterClass, spawn, map, saved = null }) {
    const player = saved
      ? createPlayerFromSave({ id, name, characterClass, spawn, map, saved })
      : createPlayer({ id, name, characterClass, spawn });
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
}
