import { tileToPixel } from '../map/collision.js';
import { createPlayerStats, statsToJSON } from '../../shared/stats.js';

export class Player {
  constructor({ id, name, characterClass, x, y, stats }) {
    this.id = id;
    this.name = name;
    this.characterClass = characterClass;
    this.x = x;
    this.y = y;
    this.direction = 'down';
    this.facing = 'down';
    this.aimX = x;
    this.aimY = y;
    this.moving = false;
    this.attacking = false;

    Object.assign(this, stats);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      characterClass: this.characterClass,
      x: this.x,
      y: this.y,
      direction: this.direction,
      facing: this.facing,
      aimX: this.aimX,
      aimY: this.aimY,
      moving: this.moving,
      attacking: this.attacking,
      ...statsToJSON(this),
    };
  }
}

export function createPlayer({ id, name, characterClass, spawn }) {
  const { x, y } = tileToPixel(spawn.x, spawn.y);
  const stats = createPlayerStats(characterClass);
  return new Player({ id, name, characterClass, x, y, stats });
}
