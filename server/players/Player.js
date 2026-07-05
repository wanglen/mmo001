import { tileToPixel } from '../map/collision.js';
import { createPlayerStats, statsToJSON } from '../../shared/stats.js';
import { createEmptyInventory, createEmptyEquipment, getEffectiveCombatStats } from '../../shared/inventory.js';
import { itemToJSON } from '../../shared/items.js';

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
    this.lastAttackAt = 0;
    this.inventory = createEmptyInventory();
    this.equipment = createEmptyEquipment();

    Object.assign(this, stats);
  }

  toJSON() {
    const effective = getEffectiveCombatStats(this, this.equipment);

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
      str: effective.str,
      dex: effective.dex,
      int: effective.int,
      vit: effective.vit,
      maxHp: effective.maxHp,
      maxMp: effective.maxMp,
      inventory: this.inventory.map(itemToJSON),
      equipment: Object.fromEntries(
        Object.entries(this.equipment).map(([slot, item]) => [slot, itemToJSON(item)])
      ),
    };
  }
}

export function createPlayer({ id, name, characterClass, spawn }) {
  const { x, y } = tileToPixel(spawn.x, spawn.y);
  const stats = createPlayerStats(characterClass);
  return new Player({ id, name, characterClass, x, y, stats });
}
