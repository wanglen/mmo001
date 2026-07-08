import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  WORLD_EVENT_TYPE,
  formatKillEvent,
  formatLevelUpEvent,
  formatQuestAcceptedEvent,
  formatQuestCompletedEvent,
  formatQuestProgressEvent,
  formatLootEvent,
  getQuestKillNotifications,
} from '../../shared/worldLog.js';

describe('worldLog', () => {
  it('formatKillEvent distinguishes self and other killers', () => {
    const self = formatKillEvent({
      killerName: 'Hero',
      monsterLabel: 'Goblin',
      isSelf: true,
    });
    assert.equal(self.type, WORLD_EVENT_TYPE.KILL);
    assert.match(self.text, /You slayed Goblin/);

    const other = formatKillEvent({
      killerName: 'Ally',
      monsterLabel: 'Skeleton',
      isSelf: false,
    });
    assert.match(other.text, /Ally slayed Skeleton/);
  });

  it('formatLevelUpEvent reports single and multi-level gains', () => {
    assert.match(formatLevelUpEvent({ level: 3 }).text, /level 3/);
    assert.match(formatLevelUpEvent({ level: 5, levelsGained: 2 }).text, /\+2 levels/);
  });

  it('formats quest and loot events', () => {
    assert.match(formatQuestAcceptedEvent({ questTitle: 'Goblin Menace' }).text, /accepted/);
    assert.match(formatQuestCompletedEvent({ questTitle: 'Goblin Menace' }).text, /completed/);
    assert.match(
      formatQuestProgressEvent({ questTitle: 'Goblin Menace', progressText: '2/3 Goblin' }).text,
      /2\/3 Goblin/
    );
    assert.match(formatLootEvent('Ruby').text, /Picked up Ruby/);
  });

  it('getQuestKillNotifications reports progress before kill increment', () => {
    const player = {
      questState: {
        active: {
          'goblin-menace': { progress: { kill: { goblin: 1 } } },
        },
        completed: [],
      },
    };

    const events = getQuestKillNotifications(player, 'goblin');
    assert.equal(events.length, 1);
    assert.match(events[0].text, /2\/3/);
  });

  it('getQuestKillNotifications reports ready on final kill', () => {
    const player = {
      questState: {
        active: {
          'goblin-menace': { progress: { kill: { goblin: 2 } } },
        },
        completed: [],
      },
    };

    const events = getQuestKillNotifications(player, 'goblin');
    assert.equal(events.length, 1);
    assert.match(events[0].text, /objective complete/i);
  });
});
