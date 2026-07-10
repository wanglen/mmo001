import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildQuestGenerationPrompt,
  clampRewardBudget,
  generateQuestFromOllama,
  isDuplicateGeneratedQuest,
  parseQuestJson,
  questObjectiveFingerprint,
  sanitizeGeneratedQuest,
  titleFromObjective,
} from '../../../server/llm/questGenerator.js';

describe('questGenerator', () => {
  it('parseQuestJson strips markdown fences', () => {
    const quest = parseQuestJson('```json\n{"title":"Hunt","objectives":[]}\n```');
    assert.equal(quest.title, 'Hunt');
  });

  it('buildQuestGenerationPrompt includes catalog and giver', () => {
    const prompt = buildQuestGenerationPrompt({
      giverNpcId: 'guide-eldon',
      level: 3,
      mapId: 'town',
      activeQuestIds: [],
      completedQuestIds: ['goblin-menace'],
      recentGeneratedTitles: ['Goblin Sweep'],
      recentFingerprints: ['kill:goblin:wilderness'],
      preferType: 'fetch',
      seed: 'abc123',
    });
    const payload = JSON.parse(prompt);
    assert.equal(payload.constraints.giverNpcId, 'guide-eldon');
    assert.equal(payload.constraints.preferType, 'fetch');
    assert.equal(payload.constraints.seed, 'abc123');
    assert.deepEqual(payload.player.recentGeneratedTitles, ['Goblin Sweep']);
    assert.deepEqual(payload.player.recentObjectiveFingerprints, ['kill:goblin:wilderness']);
    assert.ok(payload.catalog.monsterTypes.includes('goblin'));
    assert.ok(payload.catalog.npcIds.includes('innkeeper-mira'));
  });

  it('isDuplicateGeneratedQuest matches title and objective fingerprint', () => {
    const quest = {
      title: 'Goblin Sweep',
      objectives: [{ type: 'kill', monsterType: 'goblin', requiredMapId: 'wilderness' }],
    };
    assert.equal(questObjectiveFingerprint(quest), 'kill:goblin:wilderness');
    assert.equal(
      isDuplicateGeneratedQuest(quest, { fingerprints: ['kill:goblin:wilderness'] }),
      true
    );
    assert.equal(
      isDuplicateGeneratedQuest(quest, { titles: ['goblin sweep'] }),
      true
    );
    assert.equal(
      isDuplicateGeneratedQuest(quest, {
        titles: ['Other'],
        fingerprints: ['fetch:health_potion'],
      }),
      false
    );
  });

  it('titleFromObjective builds clean player-facing titles', () => {
    assert.equal(
      titleFromObjective({ type: 'kill', monsterType: 'ghoul', requiredMapId: 'dungeon' }),
      'Ghoul Hunt'
    );
    assert.equal(titleFromObjective({ type: 'fetch', itemKey: 'health_potion' }), 'Gather health potion');
    assert.equal(titleFromObjective({ type: 'talk', npcId: 'guide-eldon' }), 'Deliver a Message');
  });

  it('last-resort duplicate path does not append hex to titles', async () => {
    const fakeChat = async () => ({
      content: JSON.stringify({
        title: 'Same Hunt',
        giverNpcId: 'guide-eldon',
        turnInNpcId: 'guide-eldon',
        prerequisites: [],
        objectives: [
          { type: 'kill', monsterType: 'goblin', count: 2, requiredMapId: 'wilderness' },
        ],
        rewards: { xp: 30, gold: 15, items: [] },
        dialogue: {
          offer: ['Go.'],
          progress: ['Working.'],
          ready: ['Done.'],
          complete: ['Thanks.'],
        },
      }),
      raw: {},
    });

    const result = await generateQuestFromOllama({
      baseUrl: 'http://127.0.0.1:11434',
      model: 'mmo001-quests',
      giverNpcId: 'guide-eldon',
      level: 2,
      mapId: 'town',
      activeQuestIds: [],
      completedQuestIds: [],
      recentGeneratedTitles: ['Same Hunt'],
      recentFingerprints: ['kill:goblin:wilderness'],
      chat: fakeChat,
    });

    assert.equal(result.ok, true);
    assert.doesNotMatch(result.quest.title, /[0-9a-f]{4}$/i);
    assert.notEqual(questObjectiveFingerprint(result.quest), 'kill:goblin:wilderness');
  });

  it('sanitizeGeneratedQuest assigns gen id and clamps rewards', () => {
    const quest = sanitizeGeneratedQuest(
      {
        id: 'whatever',
        title: 'Big Hunt',
        giverNpcId: 'wrong',
        turnInNpcId: 'guide-eldon',
        prerequisites: ['nope'],
        objectives: [
          { type: 'kill', monsterType: 'goblin', count: 99, requiredMapId: 'wilderness' },
        ],
        rewards: { xp: 9999, gold: 9999, items: [{ templateKey: 'health_potion' }] },
        dialogue: {
          offer: ['Go.'],
          progress: ['Working.'],
          ready: ['Done.'],
          complete: ['Thanks.'],
        },
      },
      { giverNpcId: 'guide-eldon', level: 1 }
    );

    assert.match(quest.id, /^gen-/);
    assert.equal(quest.giverNpcId, 'guide-eldon');
    assert.deepEqual(quest.prerequisites, []);
    assert.equal(quest.objectives[0].count, 8);
    const budget = clampRewardBudget(1);
    assert.ok(quest.rewards.xp <= budget.xp);
    assert.ok(quest.rewards.gold <= budget.gold);
    assert.equal(quest.rewards.items[0].templateKey, 'health_potion');
  });

  it('generateQuestFromOllama uses mocked chat and returns validated quest', async () => {
    const fakeChat = async () => ({
      content: JSON.stringify({
        title: 'Mock Task',
        giverNpcId: 'guide-eldon',
        turnInNpcId: 'guide-eldon',
        prerequisites: [],
        objectives: [
          { type: 'kill', monsterType: 'goblin', count: 2, requiredMapId: 'wilderness' },
        ],
        rewards: { xp: 30, gold: 15, items: [] },
        dialogue: {
          offer: ['Slay goblins.'],
          progress: ['Keep going.'],
          ready: ['Return.'],
          complete: ['Done.'],
        },
      }),
      raw: {},
    });

    const result = await generateQuestFromOllama({
      baseUrl: 'http://127.0.0.1:11434',
      model: 'mmo001-quests',
      giverNpcId: 'guide-eldon',
      level: 2,
      mapId: 'town',
      activeQuestIds: [],
      completedQuestIds: [],
      chat: fakeChat,
    });

    assert.equal(result.ok, true);
    assert.match(result.quest.id, /^gen-/);
    assert.equal(result.quest.title, 'Mock Task');
  });

  it('generateQuestFromOllama retries once then fails', async () => {
    let calls = 0;
    const fakeChat = async () => {
      calls += 1;
      return { content: 'not-json', raw: {} };
    };

    const result = await generateQuestFromOllama({
      baseUrl: 'http://127.0.0.1:11434',
      model: 'mmo001-quests',
      giverNpcId: 'guide-eldon',
      level: 1,
      mapId: 'town',
      activeQuestIds: [],
      completedQuestIds: [],
      chat: fakeChat,
    });

    assert.equal(result.ok, false);
    assert.ok(calls >= 1);
  });
});
