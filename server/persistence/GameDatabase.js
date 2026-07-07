import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  hashPassword,
  verifyPassword,
  validateUsername,
  validatePassword,
  MAX_CHARACTERS_PER_ACCOUNT,
} from './auth.js';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  data TEXT NOT NULL,
  saved_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_characters_account ON characters(account_id);
`;

/**
 * SQLite persistence for accounts and character saves.
 */
export class GameDatabase {
  /**
   * @param {string} dbPath
   */
  constructor(dbPath) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.db.exec(SCHEMA);
  }

  /** @returns {boolean} */
  hasCharacters() {
    const row = this.db.prepare('SELECT COUNT(*) AS count FROM characters').get();
    return (row?.count ?? 0) > 0;
  }

  close() {
    this.db.close();
  }

  /**
   * @param {string} username
   * @param {string} password
   * @returns {Promise<{ ok: true, accountId: string, username: string } | { ok: false, reason: string }>}
   */
  async registerAccount(username, password) {
    const userCheck = validateUsername(username);
    if (!userCheck.ok) return userCheck;

    const passCheck = validatePassword(password);
    if (!passCheck.ok) return passCheck;

    const existing = this.db
      .prepare('SELECT id FROM accounts WHERE username = ? COLLATE NOCASE')
      .get(userCheck.username);
    if (existing) return { ok: false, reason: 'username_taken' };

    const id = crypto.randomUUID();
    const passwordHash = await hashPassword(password);
    const createdAt = new Date().toISOString();

    this.db
      .prepare('INSERT INTO accounts (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)')
      .run(id, userCheck.username, passwordHash, createdAt);

    return { ok: true, accountId: id, username: userCheck.username };
  }

  /**
   * @returns {Promise<{ ok: true, accountId: string, username: string } | { ok: false, reason: string }>}
   */
  async loginAccount(username, password) {
    const userCheck = validateUsername(username);
    if (!userCheck.ok) return { ok: false, reason: 'invalid_credentials' };

    const row = this.db
      .prepare('SELECT id, username, password_hash FROM accounts WHERE username = ? COLLATE NOCASE')
      .get(userCheck.username);
    if (!row) return { ok: false, reason: 'invalid_credentials' };

    const valid = await verifyPassword(password, row.password_hash);
    if (!valid) return { ok: false, reason: 'invalid_credentials' };

    return { ok: true, accountId: row.id, username: row.username };
  }

  /** @param {string} accountId */
  getAccountById(accountId) {
    return this.db.prepare('SELECT id, username, created_at FROM accounts WHERE id = ?').get(accountId) ?? null;
  }

  /**
   * @param {string} username
   * @param {string} password
   * @returns {Promise<{ accountId: string } | null>}
   */
  async ensureAccount(username, password) {
    const existing = this.db
      .prepare('SELECT id FROM accounts WHERE username = ? COLLATE NOCASE')
      .get(username);
    if (existing) return { accountId: existing.id };

    const created = await this.registerAccount(username, password);
    if (!created.ok) return null;
    return { accountId: created.accountId };
  }

  /** @param {string} accountId */
  countCharacters(accountId) {
    const row = this.db
      .prepare('SELECT COUNT(*) AS count FROM characters WHERE account_id = ?')
      .get(accountId);
    return row?.count ?? 0;
  }

  /** @param {string} accountId */
  canCreateCharacter(accountId) {
    return this.countCharacters(accountId) < MAX_CHARACTERS_PER_ACCOUNT;
  }

  /**
   * @param {string} name
   * @param {string} accountId
   */
  characterOwnedByAccount(name, accountId) {
    const row = this.db
      .prepare('SELECT id FROM characters WHERE name = ? COLLATE NOCASE AND account_id = ?')
      .get(name, accountId);
    return !!row;
  }

  /** @param {string} name */
  characterExists(name) {
    const row = this.db
      .prepare('SELECT id FROM characters WHERE name = ? COLLATE NOCASE')
      .get(name);
    return !!row;
  }

  /**
   * @param {string} name
   * @param {string} accountId
   * @returns {object | null}
   */
  loadCharacter(name, accountId) {
    const row = this.db
      .prepare(
        'SELECT data FROM characters WHERE name = ? COLLATE NOCASE AND account_id = ?'
      )
      .get(name, accountId);
    if (!row) return null;
    try {
      return JSON.parse(row.data);
    } catch {
      return null;
    }
  }

  /**
   * @param {string} accountId
   * @returns {{ name: string, characterClass: string, level: number, savedAt?: string }[]}
   */
  listCharacters(accountId) {
    const rows = this.db
      .prepare('SELECT name, data, saved_at FROM characters WHERE account_id = ? ORDER BY name')
      .all(accountId);

    const characters = [];
    for (const row of rows) {
      try {
        const data = JSON.parse(row.data);
        if (!data?.name || !data?.characterClass) continue;
        characters.push({
          name: data.name,
          characterClass: data.characterClass,
          level: data.level ?? 1,
          savedAt: data.savedAt ?? row.saved_at,
        });
      } catch {
        // skip corrupt rows
      }
    }
    return characters;
  }

  /**
   * @param {string} accountId
   * @param {object} data
   */
  saveCharacterData(accountId, data) {
    const name = data?.name;
    if (!name || !accountId) return false;

    const existing = this.db
      .prepare('SELECT id, account_id FROM characters WHERE name = ? COLLATE NOCASE')
      .get(name);

    if (existing && existing.account_id !== accountId) {
      return false;
    }

    const payload = { ...data, savedAt: new Date().toISOString() };
    const json = JSON.stringify(payload);

    if (existing) {
      this.db
        .prepare('UPDATE characters SET data = ?, saved_at = ? WHERE id = ?')
        .run(json, payload.savedAt, existing.id);
      return true;
    }

    if (!this.canCreateCharacter(accountId)) return false;

    this.db
      .prepare(
        'INSERT INTO characters (id, account_id, name, data, saved_at) VALUES (?, ?, ?, ?, ?)'
      )
      .run(crypto.randomUUID(), accountId, name, json, payload.savedAt);
    return true;
  }

  /**
   * @param {object} player
   * @param {string} accountId
   */
  saveCharacterPlayer(player, accountId) {
    if (!player?.name || !accountId) return false;
    return this.saveCharacterData(accountId, player);
  }

  /**
   * @param {string} name
   * @param {string} accountId
   */
  removeCharacter(name, accountId) {
    const result = this.db
      .prepare('DELETE FROM characters WHERE name = ? COLLATE NOCASE AND account_id = ?')
      .run(name, accountId);
    return result.changes > 0;
  }
}
