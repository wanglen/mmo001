import { CORE_EVENTS, onCoreDisconnect, registerCoreHandlers } from './handlers.js';

/** @type {import('../../../shared/plugins/types.js').ServerPlugin} */
export const corePlugin = {
  id: 'core',
  dependsOn: [],
  events: CORE_EVENTS,
  registerServer: registerCoreHandlers,
  onDisconnect: onCoreDisconnect,
};
