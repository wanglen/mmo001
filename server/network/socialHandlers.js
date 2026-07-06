/** @deprecated Handlers moved to server/plugins/social/ — kept for helper re-exports */
export {
  broadcastOnlinePlayers,
  emitPartyState,
  onSocialPlayerJoined as onPlayerJoinedSocial,
  onSocialDisconnect as onPlayerDisconnectedSocial,
} from '../plugins/social/index.js';

/** @deprecated Use registerHandlerRegistry via server/app/createServer.js */
export function registerSocialHandlers() {
  throw new Error('registerSocialHandlers is deprecated — use registerHandlerRegistry');
}
