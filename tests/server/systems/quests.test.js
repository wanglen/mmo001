import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createPlayer } from '../../../server/players/Player.js';
import { createEmptyQuestState } from '../../../shared/quests.js';
import {
  acceptQuestForPlayer,
  onMonsterKillQuests,
  turnInQuestForPlayer,
} from '../../../server/systems/quests.js';
import { createPotion, POTION_TEMPLATES } from '../../../shared/items.js';
import { MAP_ID } from '../../../shared/worldMaps.js';

describe('server quests', () => {
  const spawn = { x: 5, y: 5 };

  it('acceptQuestForPlayer validates quest giver', () => {
    const player = createPlayer({ id: 'p1', name: 'Hero', characterClass: 'warrior', spawn });
    const result = acceptQuestForPlayer(player, 'goblin-menace', 'guide-eldon');
    assert.equal(result.ok, true);
    assert.ok(player.questState.active['goblin-menace']);
  });

  it('onMonsterKillQuests and turnInQuestForPlayer grant rewards', () => {
    const player = createPlayer({
      id: 'p1',
      name: 'Hero',
      characterClass: 'warrior',
      spawn,
      mapId: MAP_ID.WILDERNESS,
    });
    player.questState = createEmptyQuestState();
    acceptQuestForPlayer(player, 'goblin-menace', 'guide-eldon');

    onMonsterKillQuests(player, 'goblin');
    onMonsterKillQuests(player, 'goblin');
    onMonsterKillQuests(player, 'goblin');

    const beforeGold = player.gold;
    const result = turnInQuestForPlayer(player, 'goblin-menace', 'guide-eldon');
    assert.equal(result.ok, true);
    assert.equal(player.gold, beforeGold + 25);
    assert.ok(player.questState.completed.includes('goblin-menace'));
  });

  it('turnInQuestForPlayer consumes fetch items', () => {
    const player = createPlayer({ id: 'p1', name: 'Hero', characterClass: 'warrior', spawn });
    player.questState = createEmptyQuestState();
    player.questState.completed.push('goblin-menace');
    acceptQuestForPlayer(player, 'healing-supplies', 'innkeeper-mira');
    player.inventory[0] = createPotion(POTION_TEMPLATES[0]);

    const result = turnInQuestForPlayer(player, 'healing-supplies', 'innkeeper-mira');
    assert.equal(result.ok, true);
    assert.equal(
      player.inventory.filter((item) => item?.templateKey === 'health_potion').length,
      0
    );
    assert.ok(player.inventory.some((item) => item?.templateKey === 'mana_potion'));
  });
});
