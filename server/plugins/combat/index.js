import { EVENTS } from '../../../shared/events.js';
import { processAttack } from './combat.js';
import { processSkill } from './skills.js';
import { learnPlayerSkill, assignSkillSlot, respecPlayerSkills } from './skillProgression.js';
import { interruptTownRecall } from '../core/townHub.js';
import { getLivingPlayer, getPlayerContext, persistPlayers, persistPlayer } from '../../app/handlerUtils.js';
import { serializeCombatPlayer, serializeCombatWorld } from './serialize.js';
import { registerCombatBusHandlers } from './bus.js';
import { isTownHubMap } from '../../../shared/townHub.js';

export const COMBAT_EVENTS = [
  EVENTS.ATTACK,
  EVENTS.USE_SKILL,
  EVENTS.LEARN_SKILL,
  EVENTS.SET_SKILL_SLOT,
  EVENTS.RESPEC_SKILLS,
];

/** @param {import('socket.io').Socket} socket @param {import('../../../shared/plugins/types.js').ServerContext} ctx */
export function registerCombatHandlers(socket, ctx) {
  const { world, playerManager, characterStore, partyManager, broadcastAll } = ctx;

  socket.on(EVENTS.ATTACK, async ({ targetId }) => {
    const player = getLivingPlayer(playerManager, socket.id);
    if (!player || typeof targetId !== 'string') return;

    interruptTownRecall(player);

    const { map, monsterManager, lootManager } = getPlayerContext(world, player);
    const result = processAttack({
      player,
      targetId,
      monsterManager,
      lootManager,
      map,
      partyManager,
      playerManager,
      eventBus: ctx.eventBus,
    });
    if (!result.ok && result.reason === 'cooldown') return;

    if (result.ok) {
      const saveIds = result.xpRecipientIds?.length ? result.xpRecipientIds : [player.id];
      await persistPlayers(characterStore, playerManager, saveIds);
    }
    broadcastAll();
  });

  socket.on(EVENTS.USE_SKILL, async ({ skillId, targetX, targetY, targetId }) => {
    const player = getLivingPlayer(playerManager, socket.id);
    if (!player || typeof skillId !== 'string') return;

    interruptTownRecall(player);

    const { map, monsterManager, lootManager } = getPlayerContext(world, player);
    const result = processSkill({
      player,
      skillId,
      targetX,
      targetY,
      targetId,
      monsterManager,
      lootManager,
      map,
      partyManager,
      playerManager,
      eventBus: ctx.eventBus,
    });

    if (!result.ok && (result.reason === 'cooldown' || result.reason === 'no_mp')) return;

    if (result.ok) {
      const killIds = (result.hits ?? [])
        .filter((hit) => hit.killed && hit.xpRecipientIds?.length)
        .flatMap((hit) => hit.xpRecipientIds);
      const saveIds = killIds.length ? [...new Set(killIds)] : [player.id];
      await persistPlayers(characterStore, playerManager, saveIds);
    }
    broadcastAll();
  });

  socket.on(EVENTS.LEARN_SKILL, async ({ skillId }) => {
    const player = getLivingPlayer(playerManager, socket.id);
    if (!player || typeof skillId !== 'string') return;

    const result = learnPlayerSkill(player, skillId);
    if (!result.ok) {
      socket.emit(EVENTS.ERROR, { message: `Cannot learn skill: ${result.reason}` });
      return;
    }

    await persistPlayer(characterStore, player);
    broadcastAll();
  });

  socket.on(EVENTS.SET_SKILL_SLOT, async ({ slotIndex, skillId }) => {
    const player = getLivingPlayer(playerManager, socket.id);
    if (!player || !Number.isInteger(slotIndex)) return;

    const resolvedSkillId = skillId == null ? null : skillId;
    if (resolvedSkillId != null && typeof resolvedSkillId !== 'string') return;

    const result = assignSkillSlot(player, slotIndex, resolvedSkillId);
    if (!result.ok) {
      socket.emit(EVENTS.ERROR, { message: `Cannot assign skill: ${result.reason}` });
      return;
    }

    await persistPlayer(characterStore, player);
    broadcastAll();
  });

  socket.on(EVENTS.RESPEC_SKILLS, async () => {
    const player = getLivingPlayer(playerManager, socket.id);
    if (!player) return;

    const { map } = getPlayerContext(world, player);
    if (!isTownHubMap(map)) {
      socket.emit(EVENTS.ERROR, { message: 'Respec is only available in town.' });
      return;
    }

    const result = respecPlayerSkills(player);
    if (!result.ok) {
      socket.emit(EVENTS.ERROR, { message: `Cannot respec: ${result.reason}` });
      return;
    }

    await persistPlayer(characterStore, player);
    broadcastAll();
  });
}

/** @type {import('../../../shared/plugins/types.js').ServerPlugin} */
export const combatPlugin = {
  id: 'combat',
  dependsOn: ['core'],
  events: COMBAT_EVENTS,
  registerServer: registerCombatHandlers,
  registerBus: registerCombatBusHandlers,
  serializePlayer: serializeCombatPlayer,
  serializeWorld: serializeCombatWorld,
};
