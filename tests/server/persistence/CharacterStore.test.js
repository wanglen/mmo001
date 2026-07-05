import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import {
  CharacterStore,
  playerToSaveData,
  createNewCharacterData,
  slugifyCharacterName,
} from '../../../server/persistence/CharacterStore.js';
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

  it('save and load round-trips player data by name only', async () => {
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
    const loaded = await store.load('Alice');

    assert.ok(loaded);
    assert.equal(loaded.level, 3);
    assert.equal(loaded.characterClass, 'mage');
    assert.equal(loaded.xp, 42);
    assert.ok(loaded.savedAt);
    assert.equal(path.basename(store.filePath('Alice')), 'alice.json');
  });

  it('list returns name and class for saved characters', async () => {
    await store.saveData(createNewCharacterData('Bob', 'warrior', { x: 5, y: 5 }));
    await store.saveData(createNewCharacterData('Zara', 'ranger', { x: 5, y: 5 }));

    const list = await store.list();
    assert.equal(list.length, 2);
    assert.equal(list[0].name, 'Bob');
    assert.equal(list[0].characterClass, 'warrior');
    assert.equal(list[1].name, 'Zara');
  });

  it('exists and remove work with name key', async () => {
    await store.saveData(createNewCharacterData('DeleteMe', 'mage', { x: 1, y: 1 }));
    assert.equal(await store.exists('DeleteMe'), true);
    await store.remove('DeleteMe');
    assert.equal(await store.exists('DeleteMe'), false);
  });

  it('remove deletes legacy name_class save files', async () => {
    const legacy = {
      name: 'wa',
      characterClass: 'warrior',
      level: 2,
      xp: 0,
      statPoints: 0,
      skillPoints: 0,
      str: 15,
      dex: 8,
      int: 5,
      vit: 12,
      hp: 120,
      mp: 30,
      inventory: [],
      equipment: {},
    };
    await fs.writeFile(path.join(tempDir, 'wa_warrior.json'), JSON.stringify(legacy));

    assert.equal(await store.exists('wa'), true);
    assert.equal(await store.remove('wa'), true);
    assert.equal(await store.exists('wa'), false);
    assert.equal(await store.list().then((l) => l.length), 0);
  });

  it('load migrates legacy name_class save files', async () => {
    const legacy = {
      name: 'Legacy',
      characterClass: 'mage',
      level: 2,
      xp: 5,
      statPoints: 0,
      skillPoints: 0,
      str: 5,
      dex: 8,
      int: 15,
      vit: 6,
      hp: 70,
      mp: 100,
      inventory: [],
      equipment: {},
    };
    await fs.writeFile(path.join(tempDir, 'legacy_mage.json'), JSON.stringify(legacy));

    const loaded = await store.load('Legacy');
    assert.equal(loaded?.characterClass, 'mage');
    assert.equal(await store.exists('Legacy'), true);
    assert.equal(slugifyCharacterName('Legacy'), 'legacy');
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
