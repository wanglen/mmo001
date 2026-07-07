import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { PORT, SESSION_SECRET } from '../config.js';
import { PlayerManager } from '../entities/PlayerManager.js';
import { CharacterStore } from '../persistence/CharacterStore.js';
import { GameDatabase } from '../persistence/GameDatabase.js';
import { migrateLegacyIfEmpty } from '../persistence/migrateLegacy.js';
import {
  createSessionToken,
  resolveSessionSecret,
  MAX_CHARACTERS_PER_ACCOUNT,
} from '../persistence/auth.js';
import { PartyManager } from '../social/PartyManager.js';
import { TradeManager } from '../social/TradeManager.js';
import { registerHandlerRegistry } from './HandlerRegistry.js';
import { startGameLoop } from './gameLoop.js';
import { createWorld } from '../world/World.js';
import { APP_VERSION } from '../version.js';
import { loadGameContent } from './loadContent.js';
import { getAccountIdFromRequest, registerSocketAuth } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..', '..');

/**
 * Bootstrap Express, Socket.IO, plugins, and the game loop.
 *
 * @param {object} [options]
 * @param {string} [options.dbPath] — SQLite database path
 * @param {string} [options.legacyDir] — legacy JSON character directory
 */
export async function createServerApp(options = {}) {
  loadGameContent();

  const dbPath = options.dbPath ?? path.join(rootDir, 'data', 'game.db');
  const legacyDir = options.legacyDir ?? path.join(rootDir, 'data', 'characters');
  const sessionSecret = resolveSessionSecret(options.sessionSecret ?? SESSION_SECRET);

  const gameDb = new GameDatabase(dbPath);
  const migration = await migrateLegacyIfEmpty(gameDb, legacyDir);
  if (migration.imported > 0) {
    console.log(
      `Migrated ${migration.imported} legacy character(s) to account "${migration.username}"`
    );
  }

  const characterStore = new CharacterStore(gameDb);

  const app = express();
  app.use(express.json({ limit: '32kb' }));

  const httpServer = createServer(app);
  const io = new Server(httpServer);
  registerSocketAuth(io, sessionSecret);

  app.use(express.static(path.join(rootDir, 'public')));
  app.use('/shared', express.static(path.join(rootDir, 'shared')));

  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, password } = req.body ?? {};
      const result = await gameDb.registerAccount(username, password);
      if (!result.ok) {
        const message =
          result.reason === 'username_taken'
            ? 'Username already taken'
            : 'Invalid username or password';
        res.status(400).json({ error: message });
        return;
      }

      const token = createSessionToken(result.accountId, sessionSecret);
      res.json({ token, username: result.username, accountId: result.accountId });
    } catch {
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body ?? {};
      const result = await gameDb.loginAccount(username, password);
      if (!result.ok) {
        res.status(401).json({ error: 'Invalid username or password' });
        return;
      }

      const token = createSessionToken(result.accountId, sessionSecret);
      res.json({ token, username: result.username, accountId: result.accountId });
    } catch {
      res.status(500).json({ error: 'Login failed' });
    }
  });

  app.get('/api/characters', async (req, res) => {
    const accountId = getAccountIdFromRequest(req, sessionSecret);
    if (!accountId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const characters = await characterStore.list(accountId);
      res.json({ characters, maxCharacters: MAX_CHARACTERS_PER_ACCOUNT });
    } catch {
      res.status(500).json({ error: 'Failed to list characters' });
    }
  });

  app.get('/api/version', (_req, res) => {
    res.json({ version: APP_VERSION });
  });

  const world = createWorld();
  const playerManager = new PlayerManager();
  const partyManager = new PartyManager();
  const tradeManager = new TradeManager();

  const { broadcastAll, eventBus } = registerHandlerRegistry(io, {
    world,
    playerManager,
    characterStore,
    partyManager,
    tradeManager,
    sessionSecret,
  });

  startGameLoop({
    world,
    playerManager,
    characterStore,
    broadcast: broadcastAll,
    eventBus,
  });

  return {
    app,
    httpServer,
    io,
    world,
    playerManager,
    broadcastAll,
    eventBus,
    gameDb,
    characterStore,
  };
}

/**
 * @param {import('http').Server} httpServer
 */
export function listen(httpServer, port = PORT) {
  httpServer.listen(port, () => {
    console.log(`MMO server running at http://localhost:${port} (v${APP_VERSION})`);
  });
}
