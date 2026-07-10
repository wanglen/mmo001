import { tileToPixel, canMoveTo } from '../map/collision.js';
import { createPlayerStats } from '../../shared/stats.js';
import { createEmptyInventory, createEmptyEquipment, refreshPlayerDerivedStats } from '../../shared/inventory.js';
import { createEmptyResistances } from '../../shared/plugins/combat/damageTypes.js';
import { restoreItems } from '../persistence/CharacterStore.js';
import { DEFAULT_MAP_ID, sanitizeMapId } from '../../shared/worldMaps.js';
import { normalizeQuestState } from '../../shared/quests.js';
import { createEmptyStash } from '../../shared/stash.js';
import {
  getDefaultSkillBarSlots,
  getDefaultUnlockedSkills,
  migratePlayerSkillState,
} from '../../shared/plugins/combat/skillTree.js';
import { normalizeOpenedChests } from '../../shared/dungeonChests.js';
import { composePlayer } from '../app/composePlayer.js';

export class Player {
  constructor({ id, name, characterClass, x, y, stats, inventory, equipment, stash, mapId, questState = null }) {
    this.id = id;
    this.name = name;
    this.characterClass = characterClass;
    this.x = x;
    this.y = y;
    this.mapId = mapId ?? DEFAULT_MAP_ID;
    this.direction = 'down';
    this.facing = 'down';
    this.aimX = x;
    this.aimY = y;
    this.moving = false;
    this.attacking = false;
    this.lastMoveAt = 0;
    this.lastAttackAt = 0;
    this.lastSkillAt = 0;
    this.lastDamagedAt = 0;
    this.dead = false;
    this.townRecallCasting = false;
    this.townRecallCastMs = 0;
    this.skillCooldowns = {};
    this.openedChests = {};
    this.unlockedSkills = getDefaultUnlockedSkills(characterClass);
    this.skillBarSlots = getDefaultSkillBarSlots(characterClass);
    this.statusEffects = [];
    this.resistances = createEmptyResistances();
    this.inventory = inventory ?? createEmptyInventory();
    this.stash = stash ?? createEmptyStash();
    this.equipment = equipment ?? createEmptyEquipment();
    this.gold = stats.gold ?? 0;
    this.questState = normalizeQuestState(questState ?? stats.questState);

    Object.assign(this, stats);
  }

  toJSON(now = Date.now()) {
    return composePlayer(this, now);
  }
}

export function createPlayer({ id, name, characterClass, spawn, mapId = DEFAULT_MAP_ID }) {
  const { x, y } = tileToPixel(spawn.x, spawn.y);
  const stats = createPlayerStats(characterClass);
  const player = new Player({ id, name, characterClass, x, y, stats, mapId });
  player.unlockedSkills = getDefaultUnlockedSkills(characterClass);
  player.skillBarSlots = getDefaultSkillBarSlots(characterClass);
  return player;
}

export function createPlayerFromSave({
  id,
  name,
  characterClass,
  spawn,
  map,
  saved,
  mapId = DEFAULT_MAP_ID,
  forceSpawn = false,
}) {
  const resolvedMapId = forceSpawn ? mapId : sanitizeMapId(saved.mapId, mapId);
  const spawnPos = tileToPixel(spawn.x, spawn.y);
  let x;
  let y;

  if (forceSpawn) {
    x = spawnPos.x;
    y = spawnPos.y;
  } else {
    x = typeof saved.x === 'number' ? saved.x : spawnPos.x;
    y = typeof saved.y === 'number' ? saved.y : spawnPos.y;

    if (!canMoveTo(map, x, y)) {
      x = spawnPos.x;
      y = spawnPos.y;
    }
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
    gold: saved.gold,
  });

  const { inventory, equipment, stash } = restoreItems(saved);

  const player = new Player({
    id,
    name,
    characterClass,
    x,
    y,
    stats,
    inventory,
    equipment,
    stash,
    mapId: resolvedMapId,
    questState: saved.quests,
  });

  refreshPlayerDerivedStats(player, player.equipment);
  migratePlayerSkillState(player, {
    unlockedSkills: saved.unlockedSkills,
    skillBarSlots: saved.skillBarSlots,
    skillPoints: saved.skillPoints,
  });
  player.openedChests = normalizeOpenedChests(saved.openedChests);
  return player;
}
