import fs from 'fs/promises';
import path from 'path';
import { GameDatabase } from './GameDatabase.js';

/**
 * Import legacy JSON character files into the database on first run.
 * Assigns all imported characters to a bootstrap account (default username `legacy`).
 *
 * @param {GameDatabase} db
 * @param {string} legacyDir
 * @param {object} [options]
 * @param {string} [options.username]
 * @param {string} [options.password]
 */
export async function migrateLegacyCharacterFiles(db, legacyDir, options = {}) {
  const username = options.username ?? process.env.LEGACY_ACCOUNT_USERNAME ?? 'legacy';
  const password = options.password ?? process.env.LEGACY_ACCOUNT_PASSWORD ?? 'legacy';

  let files = [];
  try {
    files = await fs.readdir(legacyDir);
  } catch {
    return { imported: 0, accountId: null };
  }

  const jsonFiles = files.filter((file) => file.endsWith('.json'));
  if (!jsonFiles.length) return { imported: 0, accountId: null };

  const account = await db.ensureAccount(username, password);
  if (!account) return { imported: 0, accountId: null };

  let imported = 0;
  for (const file of jsonFiles) {
    const fullPath = path.join(legacyDir, file);
    let data;
    try {
      const raw = await fs.readFile(fullPath, 'utf8');
      data = JSON.parse(raw);
    } catch {
      continue;
    }

    if (!data?.name || !data?.characterClass) continue;
    if (db.characterExists(data.name)) continue;

    if (db.saveCharacterData(account.accountId, data)) {
      imported += 1;
    }
  }

  return { imported, accountId: account.accountId, username };
}

/**
 * Run migration only when the database has no characters yet.
 * @param {GameDatabase} db
 * @param {string} legacyDir
 */
export async function migrateLegacyIfEmpty(db, legacyDir) {
  if (db.hasCharacters()) {
    return { imported: 0, skipped: true };
  }
  return migrateLegacyCharacterFiles(db, legacyDir);
}
