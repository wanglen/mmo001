import { FULL_SNAPSHOT_INTERVAL_TICKS } from '../../shared/plugins/world/gameTick.js';
import { snapshotEntityCollections } from '../../shared/plugins/world/delta.js';
import { buildWorldState } from './WorldStateBuilder.js';
import { isDebugEventsEnabled } from '../debug/eventLog.js';

/**
 * Per-socket world sync: interest-filtered snapshots with delta updates.
 */
export class WorldStateSyncManager {
  constructor() {
    /** @type {Map<string, { seq: number, tick: number, lastFullTick: number, entities: object }>} */
    this.cache = new Map();
  }

  /** @param {string} socketId */
  clear(socketId) {
    this.cache.delete(socketId);
  }

  /**
   * @param {string} viewerId
   * @param {object} world
   * @param {import('../players/PlayerManager.js').PlayerManager} playerManager
   * @param {{ includeMapTiles?: boolean, tick?: number }} [options]
   */
  build(viewerId, world, playerManager, { includeMapTiles = false, tick = 0 } = {}) {
    const state = buildWorldState(world, playerManager, viewerId, { includeMapTiles: true });
    const cached = this.cache.get(viewerId);
    const forceFull = includeMapTiles || !cached;
    const dueFull =
      cached && tick - cached.lastFullTick >= FULL_SNAPSHOT_INTERVAL_TICKS;
    const full = forceFull || dueFull;

    if (full) {
      const seq = (cached?.seq ?? 0) + 1;
      const payload = {
        sync: { seq, delta: false, tick },
        ...state,
      };
      if (isDebugEventsEnabled()) {
        payload.debug = true;
      }
      this.cache.set(viewerId, {
        seq,
        tick,
        lastFullTick: tick,
        entities: snapshotEntityCollections(state),
      });
      return payload;
    }

    const seq = cached.seq + 1;
    this.cache.set(viewerId, {
      seq,
      tick,
      lastFullTick: cached.lastFullTick,
      entities: snapshotEntityCollections(state),
    });

    return {
      sync: { seq, delta: true, tick },
      map: state.map?.tileChunks
        ? {
            mapId: state.map.mapId,
            width: state.map.width,
            height: state.map.height,
            tileChunks: state.map.tileChunks,
          }
        : undefined,
      player: state.player,
      monsters: state.monsters,
      loot: state.loot,
      players: state.players,
      combatFx: state.combatFx,
      skillFx: state.skillFx,
    };
  }
}
