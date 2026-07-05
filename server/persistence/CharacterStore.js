import fs from 'fs/promises';
import path from 'path';
import { itemToJSON } from '../../shared/items.js';
import { createEmptyInventory, createEmptyEquipment } from '../../shared/inventory.js';

function slugify(name, characterClass) {
  return `${name.trim().toLowerCase()}_${characterClass}`.replace(/[^a-z0-9_-]/g, '');
}

export function playerToSaveData(player) {
  return {
    name: player.name,
    characterClass: player.characterClass,
    x: player.x,
    y: player.y,
    level: player.level,
    xp: player.xp,
    statPoints: player.statPoints ?? 0,
    skillPoints: player.skillPoints ?? 0,
    str: player.str,
    dex: player.dex,
    int: player.int,
    vit: player.vit,
    hp: player.hp,
    mp: player.mp,
    inventory: player.inventory.map(itemToJSON),
    equipment: Object.fromEntries(
      Object.entries(player.equipment).map(([slot, item]) => [slot, itemToJSON(item)])
    ),
    savedAt: new Date().toISOString(),
  };
}

export class CharacterStore {
  constructor(dataDir) {
    this.dataDir = dataDir;
  }

  filePath(name, characterClass) {
    return path.join(this.dataDir, `${slugify(name, characterClass)}.json`);
  }

  async ensureDir() {
    await fs.mkdir(this.dataDir, { recursive: true });
  }

  async load(name, characterClass) {
    try {
      const raw = await fs.readFile(this.filePath(name, characterClass), 'utf8');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  async save(player) {
    await this.ensureDir();
    const file = this.filePath(player.name, player.characterClass);
    await fs.writeFile(file, JSON.stringify(playerToSaveData(player), null, 2), 'utf8');
  }

  async remove(name, characterClass) {
    try {
      await fs.unlink(this.filePath(name, characterClass));
    } catch {
      // ignore missing file
    }
  }
}

/** Restore inventory/equipment item references from saved JSON. */
export function restoreItems(saved) {
  const inventory = createEmptyInventory();
  const equipment = createEmptyEquipment();

  if (Array.isArray(saved.inventory)) {
    saved.inventory.forEach((item, index) => {
      if (item && index < inventory.length) inventory[index] = { ...item, stats: { ...item.stats } };
    });
  }

  if (saved.equipment && typeof saved.equipment === 'object') {
    for (const [slot, item] of Object.entries(saved.equipment)) {
      if (item) equipment[slot] = { ...item, stats: { ...item.stats } };
    }
  }

  return { inventory, equipment };
}
