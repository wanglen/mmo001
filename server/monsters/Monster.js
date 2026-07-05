import { MONSTER_TYPES } from '../../shared/monsters.js';

let nextId = 1;

export class Monster {
  constructor({ type, x, y }) {
    const def = MONSTER_TYPES[type];
    this.id = `m${nextId++}`;
    this.type = type;
    this.label = def.label;
    this.x = x;
    this.y = y;
    this.maxHp = def.hp;
    this.hp = def.hp;
    this.speed = def.speed;
    this.damage = def.damage;
    this.aggroRange = def.aggroRange;
    this.attackRange = def.attackRange;
    this.color = def.color;
    this.xpReward = def.xpReward ?? 10;
    this.moving = false;
    this.targetPlayerId = null;
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      label: this.label,
      x: this.x,
      y: this.y,
      hp: this.hp,
      maxHp: this.maxHp,
      color: this.color,
      moving: this.moving,
    };
  }
}

export function createMonster(type, x, y) {
  return new Monster({ type, x, y });
}
