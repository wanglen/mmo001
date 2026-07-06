import { getSkillBar, getSkillCooldownRemaining } from '../../../shared/skills.js';
import { collectActiveSkillFx } from '../../systems/skills.js';
import { collectCombatFx } from '../../systems/combatFx.js';
import { playerMapId } from '../../app/handlerUtils.js';

/** @param {import('../players/Player.js').Player} player @param {number} now */
export function serializeCombatPlayer(player, now) {
  return {
    skillBar: getSkillBar(player.characterClass).map((skill) =>
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
  };
}

/** @param {import('../../shared/plugins/types.js').WorldSerializeContext} ctx */
export function serializeCombatWorld(ctx) {
  const { world, playerManager, viewerId, now } = ctx;
  const player = playerManager.get(viewerId);
  const mapId = playerMapId(player);
  const { monsterManager } = world.getContext(mapId);

  return {
    monsters: monsterManager.getAll(),
    skillFx: collectActiveSkillFx(playerManager, now),
    combatFx: collectCombatFx(now),
  };
}
