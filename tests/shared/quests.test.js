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
  recordQuestKill,
  recordQuestTalk,
} from '../../shared/quests.js';
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

    recordQuestKill(state, 'goblin');
    recordQuestKill(state, 'goblin');
    const quest = getQuestDef('goblin-menace');
    assert.equal(isQuestReady(quest, state, []), false);

    recordQuestKill(state, 'goblin');
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
    recordQuestKill(state, 'goblin');
    recordQuestKill(state, 'goblin');
    recordQuestKill(state, 'goblin');

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
});
