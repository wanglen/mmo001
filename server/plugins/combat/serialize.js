import { getSkillBar, getSkillCooldownRemaining } from '../../../shared/skills.js';
import {
  getEffectiveSkillBar,
  getClassBuilds,
  respecGoldCost,
  SKILL_TREES,
} from '../../../shared/plugins/combat/skillTree.js';
import { collectActiveSkillFx } from './skills.js';
import { collectCombatFx } from './combatFx.js';
import { playerMapId } from '../../app/handlerUtils.js';
import { filterEntitiesForViewer } from '../../app/interest.js';

/** @param {import('../players/Player.js').Player} player @param {number} now */
export function serializeCombatPlayer(player, now) {
  const skillBar = getEffectiveSkillBar(player);
  const characterClass = player.characterClass;
  const tree = SKILL_TREES[characterClass] ?? {};

  return {
    skillBar: skillBar.map((skill) =>
      skill
        ? {
            id: skill.id,
            name: skill.name,
            icon: skill.icon,
            mpCost: skill.mpCost,
            cooldownMs: skill.cooldownMs,
          }
        : null
    ),
    skillCooldowns: getSkillCooldownRemaining(player, now),
    unlockedSkills: [...(player.unlockedSkills ?? [])],
    skillBarSlots: [...(player.skillBarSlots ?? [])],
    skillTree: Object.fromEntries(
      Object.entries(tree).map(([skillId, node]) => [
        skillId,
        { tier: node.tier, cost: node.cost, requires: node.requires ?? [] },
      ])
    ),
    skillBuilds: Object.fromEntries(
      Object.entries(getClassBuilds(characterClass)).map(([id, build]) => [
        id,
        { name: build.name, description: build.description, skills: build.skills },
      ])
    ),
    respecGoldCost: respecGoldCost(player.level),
  };
}

/** @param {import('../../shared/plugins/types.js').WorldSerializeContext} ctx */
export function serializeCombatWorld(ctx) {
  const { world, playerManager, viewerId, now } = ctx;
  const player = playerManager.get(viewerId);
  const mapId = playerMapId(player);
  const { map, monsterManager } = world.getContext(mapId);

  let monsters = monsterManager.getAll();
  if (player) {
    monsters = filterEntitiesForViewer(player.x, player.y, monsters, map.width, map.height);
  }

  return {
    monsters,
    skillFx: collectActiveSkillFx(playerManager, now),
    combatFx: collectCombatFx(now),
  };
}
