import { createServerApp, listen } from './app/createServer.js';
import { PORT, warnProductionConfig } from './config.js';
import { isDebugEventsEnabled, getDebugLogPath, getDebugLogRotationConfig } from './debug/eventLog.js';

warnProductionConfig();

const { httpServer } = await createServerApp();
if (isDebugEventsEnabled()) {
  const { maxBytes, maxFiles } = getDebugLogRotationConfig();
  console.log(
    `Debug event log: ${getDebugLogPath()} (rotate at ${maxBytes} bytes, keep ${maxFiles} files)`
  );
}
listen(httpServer, PORT);
