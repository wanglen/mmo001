import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { PORT } from './config.js';
import { generateMap } from './map/MapGenerator.js';
import { PlayerManager } from './players/PlayerManager.js';
import { registerSocketHandlers } from './network/socketHandlers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(express.static(path.join(rootDir, 'public')));
app.use('/shared', express.static(path.join(rootDir, 'shared')));

const map = generateMap();
const playerManager = new PlayerManager();

registerSocketHandlers(io, map, playerManager);

httpServer.listen(PORT, () => {
  console.log(`MMO server running at http://localhost:${PORT}`);
});
