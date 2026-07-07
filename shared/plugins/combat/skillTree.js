import skillsData from '../../content/skills.json' with { type: 'json' };
import { CLASS_SKILL_BARS, SKILLS, SKILL_SLOT_COUNT } from './skills.js';
import { SKILL_POINTS_PER_LEVEL } from '../../stats.js';
import { canAffordGold, spendGold } from '../../economy.js';

export const SKILL_TREES = skillsData.skillTrees ?? {};
export const CLASS_BUILDS = skillsData.builds ?? {};
export const RESPEC_BASE_GOLD = 100;
export const RESPEC_GOLD_PER_LEVEL = 50;

/**
 * @param {string} characterClass
 * @param {string} skillId
 */
export function getTreeNode(characterClass, skillId) {
  return SKILL_TREES[characterClass]?.[skillId] ?? null;
}

/** Starter skills from the default class bar (unlocked on new characters). */
export function getDefaultUnlockedSkills(characterClass) {
  const bar = CLASS_SKILL_BARS[characterClass] ?? CLASS_SKILL_BARS.warrior;
  return [...new Set(bar.filter(Boolean))];
}

/** Default hotbar layout for a class. */
export function getDefaultSkillBarSlots(characterClass) {
  const bar = CLASS_SKILL_BARS[characterClass] ?? CLASS_SKILL_BARS.warrior;
  const slots = bar.slice(0, SKILL_SLOT_COUNT);
  while (slots.length < SKILL_SLOT_COUNT) slots.push(null);
  return slots.slice(0, SKILL_SLOT_COUNT);
}

/** @param {object} player */
export function ensurePlayerSkillState(player) {
  if (!Array.isArray(player.unlockedSkills)) {
    player.unlockedSkills = getDefaultUnlockedSkills(player.characterClass);
  }
  if (!Array.isArray(player.skillBarSlots)) {
    player.skillBarSlots = getDefaultSkillBarSlots(player.characterClass);
  }
}

/** Skill points earned from leveling (first point at level 2). */
export function totalSkillPointsEarned(level) {
  return Math.max(0, (level ?? 1) - 1) * SKILL_POINTS_PER_LEVEL;
}

export function respecGoldCost(level) {
  return RESPEC_BASE_GOLD + (level ?? 1) * RESPEC_GOLD_PER_LEVEL;
}

/**
 * @param {object} player
 * @param {string} skillId
 */
export function canLearnSkill(player, skillId) {
  ensurePlayerSkillState(player);
  const skill = SKILLS[skillId];
  if (!skill) return { ok: false, reason: 'invalid_skill' };
  if (!skill.classes.includes(player.characterClass)) {
    return { ok: false, reason: 'wrong_class' };
  }
  if (player.unlockedSkills.includes(skillId)) {
    return { ok: false, reason: 'already_unlocked' };
  }

  const node = getTreeNode(player.characterClass, skillId);
  if (!node) return { ok: false, reason: 'not_in_tree' };

  const cost = node.cost ?? 1;
  if ((player.skillPoints ?? 0) < cost) {
    return { ok: false, reason: 'no_points' };
  }

  for (const req of node.requires ?? []) {
    if (!player.unlockedSkills.includes(req)) {
      return { ok: false, reason: 'missing_prerequisite' };
    }
  }

  return { ok: true, cost };
}

/** @param {object} player @param {string} skillId */
export function learnSkill(player, skillId) {
  const check = canLearnSkill(player, skillId);
  if (!check.ok) return check;

  player.skillPoints -= check.cost;
  player.unlockedSkills.push(skillId);
  return { ok: true, skillId };
}

/**
 * @param {object} player
 * @param {number} slotIndex
 * @param {string | null} skillId
 */
export function canSetSkillSlot(player, slotIndex, skillId) {
  ensurePlayerSkillState(player);
  if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= SKILL_SLOT_COUNT) {
    return { ok: false, reason: 'invalid_slot' };
  }
  if (skillId == null) return { ok: true };

  if (!player.unlockedSkills.includes(skillId)) {
    return { ok: false, reason: 'not_unlocked' };
  }

  const skill = SKILLS[skillId];
  if (!skill?.classes.includes(player.characterClass)) {
    return { ok: false, reason: 'wrong_class' };
  }

  return { ok: true };
}

/** @param {object} player @param {number} slotIndex @param {string | null} skillId */
export function setSkillSlot(player, slotIndex, skillId) {
  const check = canSetSkillSlot(player, slotIndex, skillId);
  if (!check.ok) return check;
  player.skillBarSlots[slotIndex] = skillId ?? null;
  return { ok: true, slotIndex, skillId: skillId ?? null };
}

/** @param {object} player */
export function getEffectiveSkillBar(player) {
  ensurePlayerSkillState(player);
  return player.skillBarSlots.map((id) => (id ? SKILLS[id] ?? null : null));
}

/** @param {object} player */
export function getEffectiveSkillBarIds(player) {
  ensurePlayerSkillState(player);
  return [...player.skillBarSlots];
}

/** @param {object} player */
export function canRespecSkills(player) {
  ensurePlayerSkillState(player);
  const cost = respecGoldCost(player.level);
  if (!canAffordGold(player, cost)) {
    return { ok: false, reason: 'not_enough_gold', cost };
  }
  return { ok: true, cost };
}

/** @param {object} player */
export function respecSkills(player) {
  const check = canRespecSkills(player);
  if (!check.ok) return check;

  spendGold(player, check.cost);
  player.unlockedSkills = getDefaultUnlockedSkills(player.characterClass);
  player.skillBarSlots = getDefaultSkillBarSlots(player.characterClass);
  player.skillPoints = totalSkillPointsEarned(player.level);
  player.skillCooldowns = {};
  return { ok: true, cost: check.cost };
}

/** @param {string} characterClass */
export function getClassBuilds(characterClass) {
  return CLASS_BUILDS[characterClass] ?? {};
}

/**
 * Restore skill progression for legacy saves missing unlock data.
 * @param {object} player
 * @param {{ unlockedSkills?: string[] | null, skillBarSlots?: (string | null)[] | null, skillPoints?: number }} saved
 */
export function migratePlayerSkillState(player, saved = {}) {
  if (Array.isArray(saved.unlockedSkills) && saved.unlockedSkills.length > 0) {
    player.unlockedSkills = [...saved.unlockedSkills];
  } else {
    player.unlockedSkills = getDefaultUnlockedSkills(player.characterClass);
  }

  if (Array.isArray(saved.skillBarSlots) && saved.skillBarSlots.length === SKILL_SLOT_COUNT) {
    player.skillBarSlots = saved.skillBarSlots.map((id) => id ?? null);
  } else {
    player.skillBarSlots = getDefaultSkillBarSlots(player.characterClass);
  }

  const extraUnlocked = player.unlockedSkills.filter(
    (id) => !getDefaultUnlockedSkills(player.characterClass).includes(id)
  );
  const spent = extraUnlocked.reduce(
    (sum, id) => sum + (getTreeNode(player.characterClass, id)?.cost ?? 1),
    0
  );
  const earned = totalSkillPointsEarned(player.level);
  if (saved.skillPoints == null) {
    player.skillPoints = Math.max(0, earned - spent);
  }
}
