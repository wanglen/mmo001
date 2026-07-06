import { CORE_EVENTS, onCoreDisconnect, registerCoreHandlers } from './handlers.js';
import { serializeCorePlayer, serializeCoreWorld } from './serialize.js';

/** @type {import('../../../shared/plugins/types.js').ServerPlugin} */
export const corePlugin = {
  id: 'core',
  dependsOn: [],
  events: CORE_EVENTS,
  registerServer: registerCoreHandlers,
  onDisconnect: onCoreDisconnect,
  serializePlayer: serializeCorePlayer,
  serializeWorld: serializeCoreWorld,
};
