import { createServerApp, listen } from './app/createServer.js';
import { PORT } from './config.js';

const { httpServer } = createServerApp();
listen(httpServer, PORT);
