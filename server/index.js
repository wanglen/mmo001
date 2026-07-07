import { createServerApp, listen } from './app/createServer.js';
import { PORT } from './config.js';
import { isDebugEventsEnabled, getDebugLogPath, getDebugLogRotationConfig } from './debug/eventLog.js';

const { httpServer } = await createServerApp();
if (isDebugEventsEnabled()) {
  const { maxBytes, maxFiles } = getDebugLogRotationConfig();
  console.log(
    `Debug event log: ${getDebugLogPath()} (rotate at ${maxBytes} bytes, keep ${maxFiles} files)`
  );
}
listen(httpServer, PORT);
