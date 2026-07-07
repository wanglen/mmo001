import { DOMAIN_EVENTS } from '../../../shared/plugins/domainEvents.js';
import { buildLootDropMeta } from '../../../shared/lootRules.js';
import { rollLoot } from '../../../shared/items.js';

/** @param {ReturnType<import('../../app/EventBus.js').createEventBus>} bus */
export function registerLootBusHandlers(bus) {
  bus.on(DOMAIN_EVENTS.MONSTER_KILLED, ({ killer, monster, lootManager, partyMemberIds, allPlayers, now }) => {
    if (!lootManager || !killer || !monster) return;

    const item = rollLoot(monster.type, Math.random, {
      isBoss: !!monster.isBoss,
      isElite: !!monster.isElite,
    });
    if (!item) return;

    const lootMeta = buildLootDropMeta(killer, partyMemberIds ?? [], allPlayers ?? [killer], now);
    lootManager.spawn(monster.x, monster.y, item, lootMeta);
  });
}
