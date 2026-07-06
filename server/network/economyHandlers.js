/** @deprecated Handlers moved to server/plugins/economy/ */
export { onEconomyDisconnect as onPlayerDisconnectedEconomy } from '../plugins/economy/index.js';

/** @deprecated Use registerHandlerRegistry via server/app/createServer.js */
export function registerEconomyHandlers() {
  throw new Error('registerEconomyHandlers is deprecated — use registerHandlerRegistry');
}
