import { createServerApp, listen } from './app/createServer.js';
import { PORT, warnProductionConfig } from './config.js';
import { isDebugEventsEnabled, getDebugLogPath, getDebugLogRotationConfig } from './debug/eventLog.js';
import { isQuestGenLogEnabled, getQuestGenLogPath } from './debug/questGenLog.js';

warnProductionConfig();

const { httpServer } = await createServerApp();
if (isDebugEventsEnabled()) {
  const { maxBytes, maxFiles } = getDebugLogRotationConfig();
  console.log(
    `Debug event log: ${getDebugLogPath()} (rotate at ${maxBytes} bytes, keep ${maxFiles} files)`
  );
}
if (isQuestGenLogEnabled()) {
  console.log(`Quest generation log: ${getQuestGenLogPath()}`);
}
listen(httpServer, PORT);
