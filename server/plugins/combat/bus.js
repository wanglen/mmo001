import { DOMAIN_EVENTS } from '../../../shared/plugins/domainEvents.js';
import { interruptTownRecall } from '../core/townHub.js';

/** @param {ReturnType<import('../../app/EventBus.js').createEventBus>} bus */
export function registerCombatBusHandlers(bus) {
  bus.on(DOMAIN_EVENTS.PLAYER_TELEPORTED, ({ player }) => {
    if (!player) return;
    player.attacking = false;
    player.moving = false;
    interruptTownRecall(player);
  });
}
