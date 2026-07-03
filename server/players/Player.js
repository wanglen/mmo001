import { tileToPixel } from '../map/collision.js';

export class Player {
  constructor({ id, name, characterClass, x, y }) {
    this.id = id;
    this.name = name;
    this.characterClass = characterClass;
    this.x = x;
    this.y = y;
    this.direction = 'down';
    this.moving = false;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      characterClass: this.characterClass,
      x: this.x,
      y: this.y,
      direction: this.direction,
      moving: this.moving,
    };
  }
}

export function createPlayer({ id, name, characterClass, spawn }) {
  const { x, y } = tileToPixel(spawn.x, spawn.y);
  return new Player({ id, name, characterClass, x, y });
}
