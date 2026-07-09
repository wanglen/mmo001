import { DOMAIN_EVENTS } from '../../../shared/plugins/domainEvents.js';
import { interruptTownRecall } from '../core/townHub.js';
import { isInstancedDungeonMap } from '../../../shared/dungeon.js';

/** @param {ReturnType<import('../../app/EventBus.js').createEventBus>} bus @param {import('../../../shared/plugins/types.js').ServerContext} ctx */
export function registerCombatBusHandlers(bus, ctx) {
  bus.on(DOMAIN_EVENTS.PLAYER_TELEPORTED, ({ player }) => {
    if (!player) return;
    player.attacking = false;
    player.moving = false;
    interruptTownRecall(player);
  });

  bus.on(DOMAIN_EVENTS.MONSTER_KILLED, ({ killer, monster }) => {
    if (!monster?.isBoss || !killer?.mapId || !ctx?.world) return;

    const { map, monsterManager } = ctx.world.getContext(killer.mapId);
    if (!isInstancedDungeonMap(map)) return;

    monsterManager.recordBossDefeat(Date.now());
  });
}
