import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  acceptQuest,
  canAcceptQuest,
  createEmptyQuestState,
  formatQuestProgress,
  getNpcQuestInteractions,
  getQuestDef,
  isQuestReady,
  killObjectiveMatchesMap,
  recordQuestKill,
  recordQuestTalk,
} from '../../shared/quests.js';
import { MAP_ID } from '../../shared/worldMaps.js';
import { createEmptyInventory } from '../../shared/inventory.js';
import { createPotion } from '../../shared/items.js';
import { POTION_TEMPLATES } from '../../shared/items.js';

describe('quests', () => {
  it('acceptQuest tracks prerequisite chain', () => {
    const state = createEmptyQuestState();
    assert.equal(canAcceptQuest(state, 'goblin-menace'), true);
    acceptQuest(state, 'goblin-menace');
    assert.equal(canAcceptQuest(state, 'healing-supplies'), false);

    state.completed.push('goblin-menace');
    delete state.active['goblin-menace'];
    assert.equal(canAcceptQuest(state, 'healing-supplies'), true);
  });

  it('recordQuestKill advances kill objectives', () => {
    const state = createEmptyQuestState();
    acceptQuest(state, 'goblin-menace');

    recordQuestKill(state, 'goblin', MAP_ID.WILDERNESS);
    recordQuestKill(state, 'goblin', MAP_ID.WILDERNESS);
    const quest = getQuestDef('goblin-menace');
    assert.equal(isQuestReady(quest, state, []), false);

    recordQuestKill(state, 'goblin', MAP_ID.WILDERNESS);
    assert.equal(isQuestReady(quest, state, []), true);
    assert.match(formatQuestProgress(quest, state, []), /3\/3/);
  });

  it('fetch quest becomes ready when inventory has required item', () => {
    const state = createEmptyQuestState();
    state.completed.push('goblin-menace');
    acceptQuest(state, 'healing-supplies');

    const inventory = createEmptyInventory();
    const quest = {
      id: 'healing-supplies',
      objectives: [{ type: 'fetch', itemKey: 'health_potion', count: 1 }],
    };

    assert.equal(isQuestReady(quest, state, inventory), false);
    inventory[0] = createPotion(POTION_TEMPLATES[0]);
    assert.equal(isQuestReady(quest, state, inventory), true);
  });

  it('recordQuestTalk completes talk objectives', () => {
    const state = createEmptyQuestState();
    state.completed.push('goblin-menace', 'healing-supplies');
    acceptQuest(state, 'report-to-eldon');

    recordQuestTalk(state, 'guide-eldon');
    const quest = {
      id: 'report-to-eldon',
      objectives: [{ type: 'talk', npcId: 'guide-eldon' }],
    };
    assert.equal(isQuestReady(quest, state, []), true);
  });

  it('getNpcQuestInteractions surfaces accept and turn-in actions', () => {
    const state = createEmptyQuestState();
    const available = getNpcQuestInteractions(state, [], 'guide-eldon');
    assert.equal(available[0].canAccept, true);

    acceptQuest(state, 'goblin-menace');
    recordQuestKill(state, 'goblin', MAP_ID.WILDERNESS);
    recordQuestKill(state, 'goblin', MAP_ID.WILDERNESS);
    recordQuestKill(state, 'goblin', MAP_ID.WILDERNESS);

    const ready = getNpcQuestInteractions(state, [], 'guide-eldon');
    assert.equal(ready[0].canTurnIn, true);
  });

  it('report-to-eldon shows atTarget dialogue and turn-in after talk', () => {
    const state = createEmptyQuestState();
    state.completed.push('goblin-menace', 'healing-supplies');
    acceptQuest(state, 'report-to-eldon');

    const beforeTalk = getNpcQuestInteractions(state, [], 'guide-eldon')[0];
    assert.equal(beforeTalk.canTurnIn, false);
    assert.match(beforeTalk.lines[0], /Mira sent word/);

    recordQuestTalk(state, 'guide-eldon');
    const afterTalk = getNpcQuestInteractions(state, [], 'guide-eldon')[0];
    assert.equal(afterTalk.canTurnIn, true);
  });

  it('zone quest chain requires starter completion and tracks skeleton/bat kills', () => {
    const state = createEmptyQuestState();
    state.completed.push('goblin-menace', 'healing-supplies', 'report-to-eldon');

    assert.equal(canAcceptQuest(state, 'forest-patrol'), true);
    assert.equal(canAcceptQuest(state, 'desert-scourge'), false);

    acceptQuest(state, 'forest-patrol');
    for (let i = 0; i < 5; i++) recordQuestKill(state, 'skeleton', MAP_ID.FOREST);
    assert.equal(isQuestReady(getQuestDef('forest-patrol'), state, []), true);

    state.completed.push('forest-patrol');
    delete state.active['forest-patrol'];
    acceptQuest(state, 'desert-scourge');
    for (let i = 0; i < 5; i++) recordQuestKill(state, 'bat', MAP_ID.DESERT);
    assert.equal(isQuestReady(getQuestDef('desert-scourge'), state, []), true);
  });

  it('frontier-resupply fetch quest follows desert-scourge', () => {
    const state = createEmptyQuestState();
    state.completed.push(
      'goblin-menace',
      'healing-supplies',
      'report-to-eldon',
      'forest-patrol',
      'desert-scourge'
    );

    assert.equal(canAcceptQuest(state, 'frontier-resupply'), true);
    acceptQuest(state, 'frontier-resupply');

    const inventory = createEmptyInventory();
    inventory[0] = createPotion(POTION_TEMPLATES[1]);
    assert.equal(isQuestReady(getQuestDef('frontier-resupply'), state, inventory), true);
  });

  it('recordQuestKill ignores kills outside requiredMapId', () => {
    const state = createEmptyQuestState();
    state.completed.push('goblin-menace', 'healing-supplies', 'report-to-eldon');
    acceptQuest(state, 'forest-patrol');

    for (let i = 0; i < 5; i++) recordQuestKill(state, 'skeleton', MAP_ID.WILDERNESS);
    assert.equal(state.active['forest-patrol'].progress.kill?.skeleton ?? 0, 0);

    recordQuestKill(state, 'skeleton', MAP_ID.FOREST);
    assert.equal(state.active['forest-patrol'].progress.kill.skeleton, 1);
  });

  it('killObjectiveMatchesMap allows kills when no map filter', () => {
    const objective = { type: 'kill', monsterType: 'goblin', count: 3 };
    assert.equal(killObjectiveMatchesMap(objective, MAP_ID.TOWN), true);
    assert.equal(
      killObjectiveMatchesMap({ ...objective, requiredMapId: MAP_ID.FOREST }, MAP_ID.FOREST),
      true
    );
    assert.equal(
      killObjectiveMatchesMap({ ...objective, requiredMapId: MAP_ID.FOREST }, MAP_ID.WILDERNESS),
      false
    );
  });

  it('formatQuestProgress shows zone label for map-bound kills', () => {
    const state = createEmptyQuestState();
    state.completed.push('goblin-menace', 'healing-supplies', 'report-to-eldon');
    acceptQuest(state, 'forest-patrol');
    recordQuestKill(state, 'skeleton', MAP_ID.FOREST);
    assert.match(formatQuestProgress(getQuestDef('forest-patrol'), state, []), /Dark Forest/);
  });
});
