import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createEventBus } from '../../../../server/app/EventBus.js';
import { DOMAIN_EVENTS } from '../../../../shared/plugins/domainEvents.js';
import { EVENTS } from '../../../../shared/events.js';
import { onCoreDisconnect } from '../../../../server/plugins/core/handlers.js';
import { broadcastOnlinePlayers } from '../../../../server/plugins/social/index.js';
import { registerSocialBusHandlers } from '../../../../server/plugins/social/bus.js';

function createPlayer(id, name) {
  return {
    id,
    name,
    characterClass: 'warrior',
    level: 1,
    mapId: 'town',
    x: 0,
    y: 0,
  };
}

describe('player disconnect online list', () => {
  it('broadcasts online list after the player is removed', async () => {
    const players = new Map([
      ['s1', createPlayer('s1', 'Alice')],
      ['s2', createPlayer('s2', 'Bob')],
    ]);
    const emissions = [];
    const io = {
      emit: (event, payload) => emissions.push({ event, payload }),
      sockets: { sockets: new Map() },
    };
    const playerManager = {
      getAllEntities: () => [...players.values()],
      get: (id) => players.get(id),
      remove: (id) => {
        const player = players.get(id);
        players.delete(id);
        return player;
      },
    };
    const partyManager = {
      getAffectedPlayerIds: () => [],
      onDisconnect: () => {},
    };
    const ctx = {
      io,
      playerManager,
      partyManager,
      characterStore: { save: async () => {} },
      broadcastAll: () => {},
    };

    const bus = createEventBus();
    registerSocialBusHandlers(bus, ctx);

    bus.emit(DOMAIN_EVENTS.PLAYER_DISCONNECT, { playerId: 's2', ctx });
    await onCoreDisconnect('s2', ctx);
    broadcastOnlinePlayers(io, playerManager);

    const onlineEvents = emissions.filter((entry) => entry.event === EVENTS.ONLINE_PLAYERS);
    assert.equal(onlineEvents.length, 1);
    assert.equal(onlineEvents[0].payload.count, 1);
    assert.equal(onlineEvents[0].payload.players[0].name, 'Alice');
  });
});
