import { EVENTS } from '../../../shared/events.js';
import { persistPlayer, sanitizePlayerName } from '../../app/handlerUtils.js';

const SESSION_REPLACED_MSG = 'This character logged in from another session.';

/**
 * Remove in-game sessions for a character name (duplicate login).
 * Preserves legacy behavior: social cleanup only, not economy/trade disconnect.
 *
 * @param {import('../../../shared/plugins/types.js').ServerContext} ctx
 */
export async function evictCharacterSessions(ctx, { playerName, keepSocketId }) {
  const { io, playerManager, characterStore } = ctx;
  const needle = sanitizePlayerName(playerName).toLowerCase();
  if (!needle) return;

  const matches = playerManager
    .getAllEntities()
    .filter((entry) => entry.name.toLowerCase() === needle);

  if (!matches.length) return;

  for (const entity of matches) {
    await evictSession(ctx, entity.id);

    if (entity.id === keepSocketId) continue;

    const oldSocket = io.sockets.sockets.get(entity.id);
    if (oldSocket) {
      oldSocket.emit(EVENTS.SESSION_END, { message: SESSION_REPLACED_MSG });
      oldSocket.disconnect(true);
    }
  }

  ctx.broadcastAll();
}

/** @param {string} playerId @param {import('../../../shared/plugins/types.js').ServerContext} ctx */
export async function evictSession(ctx, playerId) {
  const social = ctx.pluginsById.social;
  if (social?.onDisconnect) {
    await social.onDisconnect(playerId, ctx);
  }

  const player = ctx.playerManager.get(playerId);
  await persistPlayer(ctx.characterStore, player);
  ctx.playerManager.remove(playerId);
}
