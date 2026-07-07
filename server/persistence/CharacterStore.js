import { itemToJSON } from '../../shared/items.js';
import { createEmptyInventory, createEmptyEquipment } from '../../shared/inventory.js';
import { createEmptyStash } from '../../shared/stash.js';
import { createPlayerStats } from '../../shared/stats.js';
import { createEmptyQuestState } from '../../shared/quests.js';
import { tileToPixel } from '../map/collision.js';
import { DEFAULT_MAP_ID } from '../../shared/worldMaps.js';
import {
  getDefaultSkillBarSlots,
  getDefaultUnlockedSkills,
} from '../../shared/plugins/combat/skillTree.js';

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
    unlockedSkills: player.unlockedSkills ?? getDefaultUnlockedSkills(player.characterClass),
    skillBarSlots: player.skillBarSlots ?? getDefaultSkillBarSlots(player.characterClass),
    str: player.str,
    dex: player.dex,
    int: player.int,
    vit: player.vit,
    hp: player.hp,
    mp: player.mp,
    inventory: player.inventory.map(itemToJSON),
    stash: (player.stash ?? createEmptyStash()).map(itemToJSON),
    equipment: Object.fromEntries(
      Object.entries(player.equipment).map(([slot, item]) => [slot, itemToJSON(item)])
    ),
    gold: player.gold ?? 0,
    quests: player.questState ?? createEmptyQuestState(),
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
    unlockedSkills: getDefaultUnlockedSkills(characterClass),
    skillBarSlots: getDefaultSkillBarSlots(characterClass),
    str: stats.str,
    dex: stats.dex,
    int: stats.int,
    vit: stats.vit,
    hp: stats.hp,
    mp: stats.mp,
    inventory: createEmptyInventory(),
    stash: createEmptyStash(),
    equipment: createEmptyEquipment(),
    gold: 0,
    quests: createEmptyQuestState(),
    savedAt: new Date().toISOString(),
  };
}

/**
 * Account-scoped character persistence backed by SQLite.
 */
export class CharacterStore {
  /** @param {import('./GameDatabase.js').GameDatabase} db */
  constructor(db) {
    this.db = db;
  }

  /** @param {string} accountId */
  async list(accountId) {
    if (!accountId) return [];
    return this.db.listCharacters(accountId);
  }

  /** @param {string} name */
  async exists(name) {
    return this.db.characterExists(name);
  }

  /**
   * @param {string} name
   * @param {string} accountId
   */
  async load(name, accountId) {
    if (!accountId) return null;
    return this.db.loadCharacter(name, accountId);
  }

  /** @param {object} player — must include accountId */
  async save(player) {
    if (!player?.accountId) return;
    this.db.saveCharacterData(player.accountId, playerToSaveData(player));
  }

  /**
   * @param {object} data
   * @param {string} accountId
   */
  async saveData(data, accountId) {
    if (!accountId) return false;
    return this.db.saveCharacterData(accountId, data);
  }

  /**
   * @param {string} name
   * @param {string} accountId
   */
  async remove(name, accountId) {
    if (!accountId) return false;
    return this.db.removeCharacter(name, accountId);
  }

  /** @param {string} accountId */
  canCreate(accountId) {
    return this.db.canCreateCharacter(accountId);
  }

  /**
   * @param {string} name
   * @param {string} accountId
   */
  owns(name, accountId) {
    return this.db.characterOwnedByAccount(name, accountId);
  }
}

/** Restore a single item graph from saved JSON. */
function restoreItem(item) {
  if (!item) return null;
  return {
    ...item,
    stats: item.stats ? { ...item.stats } : undefined,
    affixes: item.affixes?.map((affix) => ({ ...affix })),
    sockets: item.sockets?.map((socket) => ({
      gem: socket.gem ? restoreItem(socket.gem) : null,
    })),
  };
}

/** Restore inventory/equipment item references from saved JSON. */
export function restoreItems(saved) {
  const inventory = createEmptyInventory();
  const equipment = createEmptyEquipment();
  const stash = createEmptyStash();

  if (Array.isArray(saved.inventory)) {
    saved.inventory.forEach((item, index) => {
      if (item && index < inventory.length) inventory[index] = restoreItem(item);
    });
  }

  if (Array.isArray(saved.stash)) {
    saved.stash.forEach((item, index) => {
      if (item && index < stash.length) stash[index] = restoreItem(item);
    });
  }

  if (saved.equipment && typeof saved.equipment === 'object') {
    for (const [slot, item] of Object.entries(saved.equipment)) {
      if (item) equipment[slot] = restoreItem(item);
    }
  }

  return { inventory, equipment, stash };
}
