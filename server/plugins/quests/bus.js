import { DOMAIN_EVENTS } from '../../../shared/plugins/domainEvents.js';
import { getQuestKillNotifications } from '../../../shared/worldLog.js';
import { onMonsterKillQuests } from './quests.js';
import { emitWorldEvent } from '../social/worldLog.js';

/** @param {ReturnType<import('../../app/EventBus.js').createEventBus>} bus @param {import('../../../shared/plugins/types.js').ServerContext} [ctx] */
export function registerQuestBusHandlers(bus, ctx) {
  bus.on(DOMAIN_EVENTS.MONSTER_KILLED, ({ recipients, monster }) => {
    if (!recipients?.length || !monster?.type) return;

    for (const recipient of recipients) {
      const notifications = getQuestKillNotifications(recipient, monster.type);
      if (ctx?.io) {
        for (const event of notifications) {
          emitWorldEvent(ctx.io, recipient.id, event);
        }
      }
      onMonsterKillQuests(recipient, monster.type);
    }
  });
}
