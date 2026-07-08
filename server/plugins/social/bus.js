import { DOMAIN_EVENTS } from '../../../shared/plugins/domainEvents.js';
import { EVENTS } from '../../../shared/events.js';
import { buildOnlineList } from '../../../shared/social.js';
import { MONSTER_TYPES } from '../../../shared/monsters.js';
import { formatKillEvent, formatLevelUpEvent } from '../../../shared/worldLog.js';
import { emitWorldEvent } from './worldLog.js';

function emitPartyState(io, partyManager, playerManager, playerIds) {
  for (const playerId of playerIds) {
    const socket = io.sockets.sockets.get(playerId);
    if (!socket) continue;
    socket.emit(EVENTS.PARTY_STATE, partyManager.getPartyStateForPlayer(playerId, playerManager));
  }
}

/** @param {ReturnType<import('../../app/EventBus.js').createEventBus>} bus @param {import('../../../shared/plugins/types.js').ServerContext} ctx */
export function registerSocialBusHandlers(bus, ctx) {
  bus.on(DOMAIN_EVENTS.PLAYER_DISCONNECT, ({ playerId, ctx: disconnectCtx }) => {
    if (!playerId || !disconnectCtx) return;

    const { io, playerManager, partyManager } = disconnectCtx;
    const affected = partyManager.getAffectedPlayerIds(playerId);
    partyManager.onDisconnect(playerId);
    io.emit(EVENTS.ONLINE_PLAYERS, buildOnlineList(playerManager.getAllEntities()));
    if (affected.length) {
      emitPartyState(io, partyManager, playerManager, affected.filter((id) => id !== playerId));
    }
  });

  if (!ctx?.io) return;

  const { io } = ctx;

  bus.on(DOMAIN_EVENTS.MONSTER_KILLED, ({ killer, monster, recipients, xpByRecipient }) => {
    if (!monster?.type || !recipients?.length) return;

    const monsterLabel = MONSTER_TYPES[monster.type]?.label ?? monster.type;
    const killerName = killer?.name ?? 'Someone';

    for (const recipient of recipients) {
      emitWorldEvent(
        io,
        recipient.id,
        formatKillEvent({
          killerName,
          monsterLabel,
          isSelf: recipient.id === killer?.id,
        })
      );

      const xpEntry = xpByRecipient?.find((entry) => entry.playerId === recipient.id);
      if (xpEntry?.result?.leveledUp) {
        emitWorldEvent(
          io,
          recipient.id,
          formatLevelUpEvent({
            level: recipient.level,
            levelsGained: xpEntry.result.levelsGained,
          })
        );
      }
    }
  });
}
