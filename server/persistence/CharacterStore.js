import fs from 'fs/promises';
import path from 'path';
import { itemToJSON } from '../../shared/items.js';
import { createEmptyInventory, createEmptyEquipment } from '../../shared/inventory.js';
import { createPlayerStats } from '../../shared/stats.js';
import { tileToPixel } from '../map/collision.js';
import { DEFAULT_MAP_ID } from '../../shared/worldMaps.js';

export function slugifyCharacterName(name) {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  return slug || 'hero';
}

export function playerToSaveData(player) {
  return {
    name: player.name,
    characterClass: player.characterClass,
    mapId: player.mapId ?? DEFAULT_MAP_ID,
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

/** Default save payload for a brand-new character at spawn. */
export function createNewCharacterData(name, characterClass, spawn) {
  const stats = createPlayerStats(characterClass);
  const { x, y } = tileToPixel(spawn.x, spawn.y);

  return {
    name,
    characterClass,
    mapId: DEFAULT_MAP_ID,
    x,
    y,
    level: stats.level,
    xp: stats.xp,
    statPoints: stats.statPoints,
    skillPoints: stats.skillPoints,
    str: stats.str,
    dex: stats.dex,
    int: stats.int,
    vit: stats.vit,
    hp: stats.hp,
    mp: stats.mp,
    inventory: createEmptyInventory(),
    equipment: createEmptyEquipment(),
    savedAt: new Date().toISOString(),
  };
}

export class CharacterStore {
  constructor(dataDir) {
    this.dataDir = dataDir;
  }

  filePath(name) {
    return path.join(this.dataDir, `${slugifyCharacterName(name)}.json`);
  }

  /** Canonical save path, or legacy file whose JSON `name` field matches. */
  async findSaveFileByName(name) {
    const canonical = this.filePath(name);
    try {
      await fs.access(canonical);
      return canonical;
    } catch {
      // fall through to legacy lookup
    }

    let files = [];
    try {
      files = await fs.readdir(this.dataDir);
    } catch {
      return null;
    }

    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const fullPath = path.join(this.dataDir, file);
      const data = await this.readJson(fullPath);
      if (data?.name === name) return fullPath;
    }

    return null;
  }

  async ensureDir() {
    await fs.mkdir(this.dataDir, { recursive: true });
  }

  async exists(name) {
    return (await this.findSaveFileByName(name)) !== null;
  }

  async load(name) {
    const file = await this.findSaveFileByName(name);
    if (!file) return null;

    const data = await this.readJson(file);
    if (!data) return null;

    const canonical = this.filePath(name);
    if (file !== canonical) {
      await this.saveData(data);
      await fs.unlink(file).catch(() => {});
    }

    return data;
  }

  async readJson(filePath) {
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  async save(player) {
    await this.ensureDir();
    await fs.writeFile(
      this.filePath(player.name),
      JSON.stringify(playerToSaveData(player), null, 2),
      'utf8'
    );
  }

  async saveData(data) {
    await this.ensureDir();
    await fs.writeFile(this.filePath(data.name), JSON.stringify(data, null, 2), 'utf8');
  }

  async remove(name) {
    const file = await this.findSaveFileByName(name);
    if (!file) return false;
    await fs.unlink(file);
    return true;
  }

  /** @returns {Promise<{ name: string, characterClass: string, level: number, savedAt?: string }[]>} */
  async list() {
    await this.ensureDir();
    let files = [];
    try {
      files = await fs.readdir(this.dataDir);
    } catch {
      return [];
    }

    const characters = [];
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      try {
        const raw = await fs.readFile(path.join(this.dataDir, file), 'utf8');
        const data = JSON.parse(raw);
        if (!data?.name || !data?.characterClass) continue;
        characters.push({
          name: data.name,
          characterClass: data.characterClass,
          level: data.level ?? 1,
          savedAt: data.savedAt,
        });
      } catch {
        // skip corrupt files
      }
    }

    return characters.sort((a, b) => a.name.localeCompare(b.name));
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
