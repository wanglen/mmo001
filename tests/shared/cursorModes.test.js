import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CURSOR_MODE } from '../../shared/events.js';
import { NPC_ROLE } from '../../shared/npcs.js';
import { resolveCursorMode } from '../../shared/cursorModes.js';

describe('cursorModes', () => {
  it('resolveCursorMode prioritizes portal over other targets', () => {
    const mode = resolveCursorMode({
      portal: { id: 'p1' },
      npc: { role: NPC_ROLE.VENDOR },
      lootDrop: { id: 'l1' },
      monster: { id: 'm1' },
    });
    assert.equal(mode, CURSOR_MODE.PORTAL);
  });

  it('resolveCursorMode uses vendor cursor for vendor NPCs', () => {
    assert.equal(
      resolveCursorMode({ npc: { role: NPC_ROLE.VENDOR } }),
      CURSOR_MODE.VENDOR
    );
  });

  it('resolveCursorMode uses talk cursor for quest and guide NPCs', () => {
    assert.equal(
      resolveCursorMode({ npc: { role: NPC_ROLE.GUIDE } }),
      CURSOR_MODE.TALK
    );
    assert.equal(
      resolveCursorMode({ npc: { role: NPC_ROLE.INNKEEPER } }),
      CURSOR_MODE.TALK
    );
  });

  it('resolveCursorMode prefers loot over monsters', () => {
    assert.equal(
      resolveCursorMode({ lootDrop: { id: 'l1' }, monster: { id: 'm1' } }),
      CURSOR_MODE.LOOT
    );
  });

  it('resolveCursorMode defaults to move', () => {
    assert.equal(resolveCursorMode({}), CURSOR_MODE.MOVE);
  });
});
