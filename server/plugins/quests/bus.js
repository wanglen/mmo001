import { DOMAIN_EVENTS } from '../../../shared/plugins/domainEvents.js';
import { onMonsterKillQuests } from '../../systems/quests.js';

/** @param {ReturnType<import('../../app/EventBus.js').createEventBus>} bus */
export function registerQuestBusHandlers(bus) {
  bus.on(DOMAIN_EVENTS.MONSTER_KILLED, ({ recipients, monster }) => {
    if (!recipients?.length || !monster?.type) return;
    for (const recipient of recipients) {
      onMonsterKillQuests(recipient, monster.type);
    }
  });
}
