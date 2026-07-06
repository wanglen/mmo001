import { EVENTS } from '../../../shared/events.js';
import {
  acceptQuestForPlayer,
  interactWithNpc,
  turnInQuestForPlayer,
} from '../../systems/quests.js';
import { getLivingPlayer, getPlayerContext, persistPlayer } from '../../app/handlerUtils.js';

export const QUEST_EVENTS = [EVENTS.NPC_INTERACT, EVENTS.QUEST_ACCEPT, EVENTS.QUEST_TURN_IN];

/** @param {import('socket.io').Socket} socket @param {import('../../../shared/plugins/types.js').ServerContext} ctx */
export function registerQuestHandlers(socket, ctx) {
  const { world, playerManager, characterStore, broadcastAll } = ctx;

  socket.on(EVENTS.NPC_INTERACT, async ({ npcId }) => {
    const player = getLivingPlayer(playerManager, socket.id);
    if (!player || typeof npcId !== 'string') return;

    const { map } = getPlayerContext(world, player);
    const npcs = map.npcs ?? map.npcsJson ?? [];
    const result = interactWithNpc(player, npcs, npcId);
    if (!result.ok) return;

    await persistPlayer(characterStore, player);
    broadcastAll();
  });

  socket.on(EVENTS.QUEST_ACCEPT, async ({ questId, npcId }) => {
    const player = getLivingPlayer(playerManager, socket.id);
    if (!player || typeof questId !== 'string' || typeof npcId !== 'string') return;

    const result = acceptQuestForPlayer(player, questId, npcId);
    if (!result.ok) {
      socket.emit(EVENTS.ERROR, { message: 'Cannot accept quest' });
      return;
    }

    await persistPlayer(characterStore, player);
    broadcastAll();
  });

  socket.on(EVENTS.QUEST_TURN_IN, async ({ questId, npcId }) => {
    const player = getLivingPlayer(playerManager, socket.id);
    if (!player || typeof questId !== 'string' || typeof npcId !== 'string') return;

    const result = turnInQuestForPlayer(player, questId, npcId);
    if (!result.ok) {
      socket.emit(EVENTS.ERROR, { message: 'Cannot turn in quest' });
      return;
    }

    await persistPlayer(characterStore, player);
    broadcastAll();
  });
}

/** @type {import('../../../shared/plugins/types.js').ServerPlugin} */
export const questsPlugin = {
  id: 'quests',
  dependsOn: ['core'],
  events: QUEST_EVENTS,
  registerServer: registerQuestHandlers,
};
