import questsData from './quests.json' with { type: 'json' };
import skillsData from './skills.json' with { type: 'json' };
import vendorsData from './vendors.json' with { type: 'json' };

const QUEST_OBJECTIVE_TYPES = new Set(['kill', 'fetch', 'talk']);
const SKILL_TYPES = new Set(['melee_aoe', 'dash', 'projectile', 'ground_aoe', 'single_target']);
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
