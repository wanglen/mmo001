import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createEventBus } from '../../../../server/app/EventBus.js';
import { DOMAIN_EVENTS } from '../../../../shared/plugins/domainEvents.js';
import { registerQuestBusHandlers } from '../../../../server/plugins/quests/bus.js';
import { createPlayer } from '../../../../server/players/Player.js';
import { acceptQuestForPlayer } from '../../../../server/systems/quests.js';

describe('quest bus handlers', () => {
  it('updates kill quest progress on monster:killed without socket', () => {
    const bus = createEventBus();
    registerQuestBusHandlers(bus);

    const player = createPlayer({
      id: 'p1',
      name: 'Hero',
      characterClass: 'warrior',
      spawn: { x: 5, y: 5 },
    });
    acceptQuestForPlayer(player, 'goblin-menace', 'guide-eldon');

    bus.emit(DOMAIN_EVENTS.MONSTER_KILLED, {
      recipients: [player],
      monster: { type: 'goblin' },
    });

    const progress = player.questState.active['goblin-menace'].progress.kill.goblin;
    assert.equal(progress, 1);
  });
});
