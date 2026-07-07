import { npcToJSON } from '../npcs.js';

/**
 * Thin wrapper for map-placed NPC records (data lives on map JSON).
 */
export class Npc {
  /** @param {object} data */
  constructor(data) {
    Object.assign(this, data);
  }

  toJSON() {
    return npcToJSON(this);
  }

  /** @param {object} data */
  static fromMapData(data) {
    return new Npc(data);
  }
}
