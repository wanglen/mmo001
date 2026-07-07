import { MONSTER_TYPES } from '../../shared/monsters.js';
import { DAMAGE_TYPE, createEmptyResistances } from '../../shared/plugins/combat/damageTypes.js';
import { getBossPhase } from '../../shared/plugins/combat/bossPhases.js';

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
    this.baseSpeed = def.speed;
    this.damage = def.damage;
    this.aggroRange = def.aggroRange;
    this.attackRange = def.attackRange;
    this.color = def.color;
    this.xpReward = def.xpReward ?? 10;
    this.isBoss = !!def.isBoss;
    this.isElite = false;
    this.eliteModifier = null;
    this.damageType = DAMAGE_TYPE.PHYSICAL;
    this.resistances = createEmptyResistances();
    this.onHitStatus = null;
    this.statusEffects = [];
    this.moving = false;
    this.targetPlayerId = null;
    this.provoked = false;
    this.lastAttackAt = 0;
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
      isBoss: this.isBoss,
      isElite: this.isElite,
      eliteModifier: this.eliteModifier,
      bossPhase: this.isBoss ? getBossPhase(this) : undefined,
    };
  }
}

export function createMonster(type, x, y) {
  return new Monster({ type, x, y });
}
