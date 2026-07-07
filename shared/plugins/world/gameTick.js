/** Fixed server simulation rate (20 Hz). */
export const GAME_TICK_HZ = 20;

export const GAME_TICK_MS = 1000 / GAME_TICK_HZ;

/** Send a full world snapshot every N ticks (~3s at 20 Hz). */
export const FULL_SNAPSHOT_INTERVAL_TICKS = 60;
