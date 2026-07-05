import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { CharacterStore, playerToSaveData } from '../../../server/persistence/CharacterStore.js';
import { createEmptyInventory, createEmptyEquipment } from '../../../shared/inventory.js';

describe('CharacterStore', () => {
  let tempDir;
  let store;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mmo001-char-'));
    store = new CharacterStore(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('save and load round-trips player data', async () => {
    const player = {
      name: 'Alice',
      characterClass: 'mage',
      x: 120,
      y: 240,
      level: 3,
      xp: 42,
      statPoints: 2,
      skillPoints: 1,
      str: 6,
      dex: 9,
      int: 17,
      vit: 7,
      hp: 100,
      mp: 80,
      inventory: createEmptyInventory(),
      equipment: createEmptyEquipment(),
    };

    await store.save(player);
    const loaded = await store.load('Alice', 'mage');

    assert.ok(loaded);
    assert.equal(loaded.level, 3);
    assert.equal(loaded.xp, 42);
    assert.equal(loaded.int, 17);
    assert.ok(loaded.savedAt);
  });

  it('playerToSaveData includes progression fields', () => {
    const data = playerToSaveData({
      name: 'Bob',
      characterClass: 'warrior',
      x: 1,
      y: 2,
      level: 2,
      xp: 10,
      statPoints: 5,
      skillPoints: 1,
      str: 15,
      dex: 8,
      int: 5,
      vit: 12,
      hp: 150,
      mp: 30,
      inventory: createEmptyInventory(),
      equipment: createEmptyEquipment(),
    });

    assert.equal(data.statPoints, 5);
    assert.equal(data.skillPoints, 1);
  });
});
