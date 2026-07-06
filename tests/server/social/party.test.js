import test from 'node:test';
import assert from 'node:assert/strict';
import { PartyManager } from '../../../server/social/PartyManager.js';

function makePlayer(id, name) {
  return { id, name, characterClass: 'warrior', level: 1, mapId: 'town' };
}

class StubPlayerManager {
  constructor(players = []) {
    this.map = new Map(players.map((player) => [player.id, player]));
  }

  get(id) {
    return this.map.get(id);
  }
}

test('PartyManager invite accept and leave flow', () => {
  const partyManager = new PartyManager();
  const pm = new StubPlayerManager([makePlayer('a', 'Alice'), makePlayer('b', 'Bob')]);
  const alice = pm.get('a');
  const bob = pm.get('b');

  const invite = partyManager.invite(alice, bob);
  assert.equal(invite.ok, true);

  let bobState = partyManager.getPartyStateForPlayer('b', pm);
  assert.ok(bobState.pendingInvite);
  assert.equal(bobState.pendingInvite.fromName, 'Alice');

  const accepted = partyManager.accept(bob);
  assert.equal(accepted.ok, true);

  bobState = partyManager.getPartyStateForPlayer('b', pm);
  assert.equal(bobState.members.length, 2);

  const left = partyManager.leave(bob);
  assert.equal(left.ok, true);
  assert.equal(partyManager.getPartyStateForPlayer('b', pm).partyId, null);
});

test('PartyManager only leader can invite additional members', () => {
  const partyManager = new PartyManager();
  const pm = new StubPlayerManager([
    makePlayer('a', 'Alice'),
    makePlayer('b', 'Bob'),
    makePlayer('c', 'Cara'),
  ]);

  partyManager.invite(pm.get('a'), pm.get('b'));
  partyManager.accept(pm.get('b'));

  const nonLeaderInvite = partyManager.invite(pm.get('b'), pm.get('c'));
  assert.equal(nonLeaderInvite.ok, false);
  assert.equal(nonLeaderInvite.reason, 'not_leader');

  const leaderInvite = partyManager.invite(pm.get('a'), pm.get('c'));
  assert.equal(leaderInvite.ok, true);
});
