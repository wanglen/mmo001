import questsData from './quests.json' with { type: 'json' };
import skillsData from './skills.json' with { type: 'json' };
import vendorsData from './vendors.json' with { type: 'json' };
import { WORLD_MAP_IDS } from '../worldMaps.js';
import { REGULAR_MONSTER_TYPES } from '../monsters.js';

const QUEST_OBJECTIVE_TYPES = new Set(['kill', 'fetch', 'talk']);
const SKILL_TYPES = new Set(['melee_aoe', 'dash', 'projectile', 'ground_aoe', 'single_target']);
const AOE_SHAPES = new Set(['arc', 'spin', 'self_pulse']);
const DAMAGE_STATS = new Set(['str', 'dex', 'int']);

/**
 * @param {unknown} quests
 * @returns {string[]}
 */
export function validateQuests(quests) {
  const errors = [];
  if (!quests || typeof quests !== 'object') {
    return ['quests: expected object'];
  }

  for (const [key, quest] of Object.entries(quests)) {
    const prefix = `quests.${key}`;
    if (!quest || typeof quest !== 'object') {
      errors.push(`${prefix}: expected object`);
      continue;
    }
    if (quest.id !== key) errors.push(`${prefix}: id must match key`);
    if (typeof quest.title !== 'string') errors.push(`${prefix}: missing title`);
    if (typeof quest.giverNpcId !== 'string') errors.push(`${prefix}: missing giverNpcId`);
    if (typeof quest.turnInNpcId !== 'string') errors.push(`${prefix}: missing turnInNpcId`);
    if (!Array.isArray(quest.objectives) || quest.objectives.length === 0) {
      errors.push(`${prefix}: objectives required`);
    } else {
      for (const [index, objective] of quest.objectives.entries()) {
        if (!QUEST_OBJECTIVE_TYPES.has(objective?.type)) {
          errors.push(`${prefix}.objectives[${index}]: invalid type`);
        }
        if (
          objective?.requiredMapId != null &&
          (typeof objective.requiredMapId !== 'string' ||
            !WORLD_MAP_IDS.includes(objective.requiredMapId))
        ) {
          errors.push(`${prefix}.objectives[${index}]: invalid requiredMapId`);
        }
        if (
          objective?.type === 'kill' &&
          objective.monsterType != null &&
          !REGULAR_MONSTER_TYPES.includes(objective.monsterType)
        ) {
          errors.push(`${prefix}.objectives[${index}]: unknown monsterType`);
        }
      }
    }
    if (!quest.dialogue || typeof quest.dialogue !== 'object') {
      errors.push(`${prefix}: dialogue required`);
    }
  }

  return errors;
}

/**
 * @param {unknown} pack
 * @returns {string[]}
 */
export function validateSkills(pack) {
  const errors = [];
  if (!pack || typeof pack !== 'object') return ['skills: expected object'];

  const { skills, classSkillBars, skillSlotCount } = pack;
  if (!Number.isInteger(skillSlotCount) || skillSlotCount < 1) {
    errors.push('skills.skillSlotCount: invalid');
  }

  if (!skills || typeof skills !== 'object') {
    errors.push('skills.skills: expected object');
    return errors;
  }

  for (const [key, skill] of Object.entries(skills)) {
    const prefix = `skills.${key}`;
    if (skill.id !== key) errors.push(`${prefix}: id must match key`);
    if (!SKILL_TYPES.has(skill.type)) errors.push(`${prefix}: invalid type`);
    if (skill.aoeShape != null && !AOE_SHAPES.has(skill.aoeShape)) {
      errors.push(`${prefix}: invalid aoeShape`);
    }
    if (!DAMAGE_STATS.has(skill.damageStat)) errors.push(`${prefix}: invalid damageStat`);
    if (!Array.isArray(skill.classes) || skill.classes.length === 0) {
      errors.push(`${prefix}: classes required`);
    }
  }

  if (!classSkillBars || typeof classSkillBars !== 'object') {
    errors.push('skills.classSkillBars: expected object');
    return errors;
  }

  for (const [characterClass, bar] of Object.entries(classSkillBars)) {
    if (!Array.isArray(bar)) {
      errors.push(`skills.classSkillBars.${characterClass}: expected array`);
      continue;
    }
    if (skillSlotCount && bar.length !== skillSlotCount) {
      errors.push(`skills.classSkillBars.${characterClass}: length must be ${skillSlotCount}`);
    }
    for (const skillId of bar) {
      if (skillId != null && !skills[skillId]) {
        errors.push(`skills.classSkillBars.${characterClass}: unknown skill "${skillId}"`);
      }
    }
  }

  const { skillTrees, builds } = pack;
  if (skillTrees && typeof skillTrees === 'object') {
    for (const [characterClass, tree] of Object.entries(skillTrees)) {
      const prefix = `skills.skillTrees.${characterClass}`;
      if (!tree || typeof tree !== 'object') {
        errors.push(`${prefix}: expected object`);
        continue;
      }
      for (const [skillId, node] of Object.entries(tree)) {
        if (!skills[skillId]) {
          errors.push(`${prefix}.${skillId}: unknown skill`);
        }
        if (!Number.isInteger(node?.tier) || node.tier < 1) {
          errors.push(`${prefix}.${skillId}: tier required`);
        }
        if (!Number.isInteger(node?.cost) || node.cost < 1) {
          errors.push(`${prefix}.${skillId}: cost required`);
        }
        for (const req of node?.requires ?? []) {
          if (!tree[req]) {
            errors.push(`${prefix}.${skillId}: missing prerequisite "${req}"`);
          }
        }
      }
    }
  }

  if (builds && typeof builds === 'object') {
    for (const [characterClass, classBuilds] of Object.entries(builds)) {
      const prefix = `skills.builds.${characterClass}`;
      for (const [buildId, build] of Object.entries(classBuilds ?? {})) {
        if (typeof build?.name !== 'string') {
          errors.push(`${prefix}.${buildId}: name required`);
        }
        if (!Array.isArray(build?.skills) || build.skills.length === 0) {
          errors.push(`${prefix}.${buildId}: skills required`);
        } else {
          for (const skillId of build.skills) {
            if (!skills[skillId]) {
              errors.push(`${prefix}.${buildId}: unknown skill "${skillId}"`);
            }
          }
        }
      }
    }
  }

  return errors;
}

/**
 * @param {unknown} pack
 * @returns {string[]}
 */
export function validateVendors(pack) {
  const errors = [];
  if (!pack || typeof pack !== 'object') return ['vendors: expected object'];

  const { vendors, stock } = pack;
  if (!vendors || typeof vendors !== 'object' || Object.keys(vendors).length === 0) {
    errors.push('vendors.vendors: expected non-empty object');
  } else {
    for (const [key, vendor] of Object.entries(vendors)) {
      if (vendor.id !== key) errors.push(`vendors.${key}: id must match key`);
      if (typeof vendor.name !== 'string') errors.push(`vendors.${key}: missing name`);
    }
  }

  if (!Array.isArray(stock) || stock.length === 0) {
    errors.push('vendors.stock: expected non-empty array');
  } else {
    for (const [index, entry] of stock.entries()) {
      if (typeof entry?.templateKey !== 'string') {
        errors.push(`vendors.stock[${index}]: templateKey required`);
      }
      if (typeof entry?.price !== 'number' || entry.price < 1) {
        errors.push(`vendors.stock[${index}]: price must be positive number`);
      }
    }
  }

  return errors;
}

/** @returns {{ ok: boolean, errors: string[] }} */
export function validateGameContent({
  quests = questsData,
  skills = skillsData,
  vendors = vendorsData,
} = {}) {
  const errors = [
    ...validateQuests(quests),
    ...validateSkills(skills),
    ...validateVendors(vendors),
  ];
  return { ok: errors.length === 0, errors };
}
