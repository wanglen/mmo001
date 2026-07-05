import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { PORT } from './config.js';
import { generateMap } from './map/MapGenerator.js';
import { PlayerManager } from './players/PlayerManager.js';
import { MonsterManager } from './monsters/MonsterManager.js';
import { LootManager } from './items/LootManager.js';
import { registerSocketHandlers } from './network/socketHandlers.js';
import { startGameLoop } from './systems/gameLoop.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(express.static(path.join(rootDir, 'public')));
app.use('/shared', express.static(path.join(rootDir, 'shared')));

const map = generateMap();
const playerManager = new PlayerManager();
const monsterManager = new MonsterManager();
const lootManager = new LootManager();
monsterManager.spawnOnMap(map);

const { broadcastAll } = registerSocketHandlers(io, map, playerManager, monsterManager, lootManager);

startGameLoop({
  map,
  playerManager,
  monsterManager,
  broadcast: broadcastAll,
});

httpServer.listen(PORT, () => {
  console.log(`MMO server running at http://localhost:${PORT}`);
});
