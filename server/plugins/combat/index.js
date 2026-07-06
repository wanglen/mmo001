import { EVENTS } from '../../../shared/events.js';
import { processAttack } from '../../systems/combat.js';
import { processSkill } from '../../systems/skills.js';
import { interruptTownRecall } from '../../systems/townHub.js';
import { getLivingPlayer, getPlayerContext, persistPlayers } from '../../app/handlerUtils.js';
import { serializeCombatPlayer, serializeCombatWorld } from './serialize.js';
import { registerCombatBusHandlers } from './bus.js';

export const COMBAT_EVENTS = [EVENTS.ATTACK, EVENTS.USE_SKILL];

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
