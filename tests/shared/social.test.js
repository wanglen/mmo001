import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHAT_CHANNEL,
  parseChatInput,
  sanitizeChatText,
  findPlayerByName,
  getPartyXpRecipients,
  isWithinPartyXpRange,
  buildOnlineList,
  PARTY_XP_SHARE_RANGE,
} from '../../shared/social.js';

test('sanitizeChatText trims and caps length', () => {
  assert.equal(sanitizeChatText('  hello   world  '), 'hello world');
  assert.equal(sanitizeChatText('x'.repeat(300)).length, 200);
});

test('parseChatInput handles whisper and party commands', () => {
  const whisper = parseChatInput('/w Hero hello there');
  assert.equal(whisper.ok, true);
  assert.equal(whisper.channel, CHAT_CHANNEL.WHISPER);
  assert.equal(whisper.targetName, 'Hero');
  assert.equal(whisper.text, 'hello there');

  const party = parseChatInput('/p lets go');
  assert.equal(party.channel, CHAT_CHANNEL.PARTY);
  assert.equal(party.text, 'lets go');

  const zone = parseChatInput('hello', CHAT_CHANNEL.ZONE);
  assert.equal(zone.channel, CHAT_CHANNEL.ZONE);
  assert.equal(zone.text, 'hello');
});

test('findPlayerByName is case insensitive', () => {
  const players = [{ id: '1', name: 'Aldric' }];
  assert.equal(findPlayerByName(players, 'aldric')?.id, '1');
  assert.equal(findPlayerByName(players, 'missing'), null);
});

test('getPartyXpRecipients shares XP with in-range party members on same map', () => {
  const killer = { id: 'k', mapId: 'wilderness', x: 100, y: 100, dead: false };
  const near = { id: 'n', mapId: 'wilderness', x: 120, y: 100, dead: false };
  const far = { id: 'f', mapId: 'wilderness', x: 900, y: 100, dead: false };
  const otherMap = { id: 'o', mapId: 'town', x: 110, y: 100, dead: false };

  const recipients = getPartyXpRecipients(
    killer,
    ['k', 'n', 'f', 'o'],
    [killer, near, far, otherMap],
    PARTY_XP_SHARE_RANGE
  );

  assert.deepEqual(
    recipients.map((entry) => entry.id).sort(),
    ['k', 'n']
  );
});

test('getPartyXpRecipients returns solo killer when not in party', () => {
  const killer = { id: 'k', mapId: 'wilderness', x: 0, y: 0, dead: false };
  const recipients = getPartyXpRecipients(killer, ['k'], [killer]);
  assert.equal(recipients.length, 1);
  assert.equal(recipients[0].id, 'k');
});

test('isWithinPartyXpRange uses pixel distance', () => {
  assert.equal(isWithinPartyXpRange(0, 0, 100, 0, 150), true);
  assert.equal(isWithinPartyXpRange(0, 0, 200, 0, 150), false);
});

test('buildOnlineList sorts by name', () => {
  const list = buildOnlineList([
    { id: '2', name: 'Zed', characterClass: 'mage', level: 2, mapId: 'town' },
    { id: '1', name: 'Amy', characterClass: 'warrior', level: 1, mapId: 'town' },
  ]);
  assert.equal(list.count, 2);
  assert.deepEqual(
    list.players.map((entry) => entry.name),
    ['Amy', 'Zed']
  );
});
