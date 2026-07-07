import { createServerApp, listen } from './app/createServer.js';
import { PORT } from './config.js';

const { httpServer } = await createServerApp();
listen(httpServer, PORT);
