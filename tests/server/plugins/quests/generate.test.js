import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { Writable } from 'stream';
import { createPlayer } from '../../../../server/players/Player.js';
import { createEmptyQuestState } from '../../../../shared/quests.js';
import { createNpc, NPC_ROLE } from '../../../../shared/npcs.js';
import { TILE_SIZE } from '../../../../shared/constants.js';
import { generateQuestForPlayer } from '../../../../server/plugins/quests/quests.js';
import { _setQuestGenStreamForTests } from '../../../../server/debug/questGenLog.js';
import { _setDebugStreamForTests } from '../../../../server/debug/eventLog.js';

describe('generateQuestForPlayer', () => {
  const spawn = { x: 5, y: 5 };
  const originalDebug = process.env.DEBUG_EVENTS;

  afterEach(() => {
    process.env.DEBUG_EVENTS = originalDebug;
    _setQuestGenStreamForTests(null);
    _setDebugStreamForTests(null);
  });

  function makeNpc(id, tile = spawn) {
    return createNpc({
      id,
      name: id,
      role: NPC_ROLE.GUIDE,
      tile,
      dialogue: ['Hello.'],
    });
  }

  it('stores a pending generated offer from mocked generator', async () => {
    const questLines = [];
    _setQuestGenStreamForTests(
      new Writable({
        write(chunk, _enc, cb) {
          questLines.push(chunk.toString());
          cb();
        },
      })
    );

    const player = createPlayer({ id: 'p1', name: 'Hero', characterClass: 'warrior', spawn });
    player.x = spawn.x * TILE_SIZE + TILE_SIZE / 2;
    player.y = spawn.y * TILE_SIZE + TILE_SIZE / 2;
    player.questState = createEmptyQuestState();

    const npc = makeNpc('guide-eldon');
    const quest = {
      id: 'gen-test01',
      title: 'Test Hunt',
      giverNpcId: 'guide-eldon',
      turnInNpcId: 'guide-eldon',
      prerequisites: [],
      objectives: [
        { type: 'kill', monsterType: 'goblin', count: 2, requiredMapId: 'wilderness' },
      ],
      rewards: { xp: 20, gold: 10, items: [] },
      dialogue: {
        offer: ['Go.'],
        progress: ['Working.'],
        ready: ['Done.'],
        complete: ['Thanks.'],
      },
    };

    const result = await generateQuestForPlayer(player, [npc], 'guide-eldon', {
      generate: async () => ({ ok: true, quest }),
    });

    assert.equal(result.ok, true);
    assert.equal(player.questState.defs['gen-test01'].title, 'Test Hunt');
    assert.ok(player.questState.lastGenAt);
    assert.ok(player.questState.recentTitles.includes('Test Hunt'));
    assert.ok(player.questState.recentFingerprints.includes('kill:goblin:wilderness'));

    assert.equal(questLines.length, 1);
    const logged = JSON.parse(questLines[0]);
    assert.equal(logged.type, 'quest_generate');
    assert.equal(logged.ok, true);
    assert.equal(logged.questId, 'gen-test01');
    assert.equal(logged.fingerprint, 'kill:goblin:wilderness');
    assert.equal(logged.playerName, 'Hero');
  });

  it('rejects when out of range', async () => {
    const questLines = [];
    _setQuestGenStreamForTests(
      new Writable({
        write(chunk, _enc, cb) {
          questLines.push(chunk.toString());
          cb();
        },
      })
    );

    const player = createPlayer({ id: 'p1', name: 'Hero', characterClass: 'warrior', spawn });
    player.x = 0;
    player.y = 0;
    const npc = makeNpc('guide-eldon', { x: 20, y: 20 });

    const result = await generateQuestForPlayer(player, [npc], 'guide-eldon', {
      generate: async () => ({ ok: true, quest: {} }),
    });

    assert.equal(result.ok, false);
    assert.equal(result.reason, 'out_of_range');
    assert.equal(questLines.length, 1);
    assert.equal(JSON.parse(questLines[0]).reason, 'out_of_range');
  });
});
