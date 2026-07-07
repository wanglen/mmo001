import { learnSkill, setSkillSlot, respecSkills } from '../../../shared/plugins/combat/skillTree.js';

/** @param {import('../../entities/Player.js').Player} player @param {string} skillId */
export function learnPlayerSkill(player, skillId) {
  return learnSkill(player, skillId);
}

/** @param {import('../../entities/Player.js').Player} player @param {number} slotIndex @param {string | null} skillId */
export function assignSkillSlot(player, slotIndex, skillId) {
  return setSkillSlot(player, slotIndex, skillId);
}

/** @param {import('../../entities/Player.js').Player} player */
export function respecPlayerSkills(player) {
  return respecSkills(player);
}
