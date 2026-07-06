import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { PORT } from '../config.js';
import { PlayerManager } from '../players/PlayerManager.js';
import { CharacterStore } from '../persistence/CharacterStore.js';
import { PartyManager } from '../social/PartyManager.js';
import { TradeManager } from '../social/TradeManager.js';
import { registerHandlerRegistry } from './HandlerRegistry.js';
import { startGameLoop } from '../systems/gameLoop.js';
import { createWorld } from '../world/World.js';
import { APP_VERSION } from '../version.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..', '..');

/**
 * Bootstrap Express, Socket.IO, plugins, and the game loop.
 *
 * @param {object} [options]
 * @param {string} [options.dataDir] — character save directory
 */
export function createServerApp(options = {}) {
  const dataDir = options.dataDir ?? path.join(rootDir, 'data', 'characters');

  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer);

  app.use(express.static(path.join(rootDir, 'public')));
  app.use('/shared', express.static(path.join(rootDir, 'shared')));

  const characterStore = new CharacterStore(dataDir);

  app.get('/api/characters', async (_req, res) => {
    try {
      const characters = await characterStore.list();
      res.json(characters);
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
  });

  startGameLoop({
    world,
    playerManager,
    characterStore,
    broadcast: broadcastAll,
    eventBus,
  });

  return { app, httpServer, io, world, playerManager, broadcastAll, eventBus };
}

/**
 * @param {import('http').Server} httpServer
 */
export function listen(httpServer, port = PORT) {
  httpServer.listen(port, () => {
    console.log(`MMO server running at http://localhost:${port} (v${APP_VERSION})`);
  });
}
