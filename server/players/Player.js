import { tileToPixel, canMoveTo } from '../map/collision.js';
import { createPlayerStats, statsToJSON } from '../../shared/stats.js';
import { createEmptyInventory, createEmptyEquipment, getEffectiveCombatStats, refreshPlayerDerivedStats } from '../../shared/inventory.js';
import { itemToJSON } from '../../shared/items.js';
import { restoreItems } from '../persistence/CharacterStore.js';

export class Player {
  constructor({ id, name, characterClass, x, y, stats, inventory, equipment }) {
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
    this.inventory = inventory ?? createEmptyInventory();
    this.equipment = equipment ?? createEmptyEquipment();

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

export function createPlayerFromSave({ id, name, characterClass, spawn, map, saved }) {
  const spawnPos = tileToPixel(spawn.x, spawn.y);
  let x = typeof saved.x === 'number' ? saved.x : spawnPos.x;
  let y = typeof saved.y === 'number' ? saved.y : spawnPos.y;

  if (!canMoveTo(map, x, y)) {
    x = spawnPos.x;
    y = spawnPos.y;
  }

  const stats = createPlayerStats(characterClass, saved.level ?? 1, {
    xp: saved.xp,
    statPoints: saved.statPoints,
    skillPoints: saved.skillPoints,
    str: saved.str,
    dex: saved.dex,
    int: saved.int,
    vit: saved.vit,
    hp: saved.hp,
    mp: saved.mp,
  });

  const { inventory, equipment } = restoreItems(saved);

  const player = new Player({
    id,
    name,
    characterClass,
    x,
    y,
    stats,
    inventory,
    equipment,
  });

  refreshPlayerDerivedStats(player, player.equipment);
  return player;
}
