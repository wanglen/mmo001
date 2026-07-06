import { DOMAIN_EVENTS } from '../../../shared/plugins/domainEvents.js';

/**
 * @param {ReturnType<import('../../app/EventBus.js').createEventBus>} eventBus
 * @param {object} player
 * @param {string} mapId
 * @param {string} [source]
 */
export function emitPlayerTeleported(eventBus, player, mapId, source) {
  if (!eventBus || !player) return;
  eventBus.emit(DOMAIN_EVENTS.PLAYER_TELEPORTED, { player, mapId, source });
}
