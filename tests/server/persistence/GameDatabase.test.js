import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { GameDatabase } from '../../../server/persistence/GameDatabase.js';
import { CharacterStore, createNewCharacterData } from '../../../server/persistence/CharacterStore.js';

describe('GameDatabase', () => {
  let tempDir;
  let dbPath;
  /** @type {GameDatabase} */
  let db;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mmo001-db-'));
    dbPath = path.join(tempDir, 'game.db');
    db = new GameDatabase(dbPath);
  });

  afterEach(() => {
    db.close();
  });

  it('registers and logs in an account', async () => {
    const created = await db.registerAccount('alice', 'password1');
    assert.equal(created.ok, true);

    const login = await db.loginAccount('alice', 'password1');
    assert.equal(login.ok, true);
    assert.equal(login.accountId, created.accountId);
  });

  it('rejects duplicate usernames', async () => {
    await db.registerAccount('bob', 'password1');
    const again = await db.registerAccount('bob', 'otherpass');
    assert.equal(again.ok, false);
    assert.equal(again.reason, 'username_taken');
  });

  it('stores characters per account', async () => {
    const account = await db.registerAccount('carol', 'password1');
    assert.equal(account.ok, true);

    const data = createNewCharacterData('Hero', 'warrior', { x: 1, y: 1 });
    assert.equal(db.saveCharacterData(account.accountId, data), true);

    const list = db.listCharacters(account.accountId);
    assert.equal(list.length, 1);
    assert.equal(list[0].name, 'Hero');

    const other = await db.registerAccount('dave', 'password1');
    assert.equal(db.loadCharacter('Hero', other.accountId), null);
    assert.ok(db.loadCharacter('Hero', account.accountId));
  });
});

describe('CharacterStore (database)', () => {
  let tempDir;
  /** @type {CharacterStore} */
  let store;
  /** @type {GameDatabase} */
  let db;
  let accountId;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mmo001-store-'));
    db = new GameDatabase(path.join(tempDir, 'game.db'));
    store = new CharacterStore(db);
    const account = await db.registerAccount('tester', 'password1');
    accountId = account.accountId;
  });

  afterEach(() => {
    db.close();
  });

  it('save and load round-trips player data for an account', async () => {
    const player = {
      accountId,
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
      inventory: [],
      equipment: {},
      stash: [],
      gold: 0,
      questState: { active: [], completed: [] },
    };

    await store.save(player);
    const loaded = await store.load('Alice', accountId);

    assert.ok(loaded);
    assert.equal(loaded.level, 3);
    assert.equal(loaded.characterClass, 'mage');
    assert.equal(loaded.xp, 42);
    assert.ok(loaded.savedAt);
  });

  it('list returns only characters for the account', async () => {
    await store.saveData(createNewCharacterData('Bob', 'warrior', { x: 5, y: 5 }), accountId);
    await store.saveData(createNewCharacterData('Zara', 'ranger', { x: 5, y: 5 }), accountId);

    const other = await db.registerAccount('other', 'password1');
    await store.saveData(createNewCharacterData('OtherHero', 'mage', { x: 1, y: 1 }), other.accountId);

    const list = await store.list(accountId);
    assert.equal(list.length, 2);
    assert.deepEqual(list.map((entry) => entry.name).sort(), ['Bob', 'Zara']);
  });

  it('owns and remove are account scoped', async () => {
    await store.saveData(createNewCharacterData('DeleteMe', 'mage', { x: 1, y: 1 }), accountId);
    assert.equal(await store.owns('DeleteMe', accountId), true);
    assert.equal(await store.remove('DeleteMe', accountId), true);
    assert.equal(await store.exists('DeleteMe'), false);
  });
});
