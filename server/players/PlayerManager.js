import { createPlayer } from './Player.js';

export class PlayerManager {
  constructor() {
    this.players = new Map();
  }

  create({ id, name, characterClass, spawn }) {
    const player = createPlayer({ id, name, characterClass, spawn });
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
    this.players.delete(id);
  }

  getAll() {
    return Array.from(this.players.values()).map((p) => p.toJSON());
  }

  getAllEntities() {
    return Array.from(this.players.values());
  }
}
