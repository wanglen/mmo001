import { EVENTS } from '../../../shared/events.js';
import { CHARACTER_CLASSES } from '../../../shared/constants.js';
import { isValidDirection } from '../../../shared/movement.js';
import { isStunned } from '../../../shared/combat.js';
import { validatePlayerMove } from '../../../shared/plugins/core/anticheat.js';
import { logGameEvent, isDebugEventsEnabled } from '../../debug/eventLog.js';
import { canMoveTo } from '../../map/collision.js';
import { respawnPlayer, syncDeathState } from './playerDeath.js';
import { createNewCharacterData } from '../../persistence/CharacterStore.js';
import { usePortal } from './zoneTransition.js';
import { startTownRecall, interruptTownRecall } from './townHub.js';
import { DEFAULT_MAP_ID, MAP_ID } from '../../../shared/worldMaps.js';
import {
  getLivingPlayer,
  getPlayerContext,
  persistPlayer,
  sanitizePlayerName,
  updatePlayerAim,
} from '../../app/handlerUtils.js';
import { evictCharacterSessions } from './session.js';
import { emitPlayerTeleported } from './bus.js';

export const CORE_EVENTS = [
  EVENTS.CREATE_CHARACTER,
  EVENTS.DELETE_CHARACTER,
  EVENTS.JOIN,
  EVENTS.RESPAWN,
  EVENTS.USE_PORTAL,
  EVENTS.CAST_TOWN_RECALL,
  EVENTS.AIM,
  EVENTS.MOVE,
  EVENTS.DEBUG_LOG,
];

/** @type {Map<string, { windowStart: number, count: number }>} */
const clientDebugRate = new Map();

/** @param {import('socket.io').Socket} socket @param {import('../../../shared/plugins/types.js').ServerContext} ctx */
export function registerCoreHandlers(socket, ctx) {
  const { io, world, playerManager, characterStore, broadcastAll, eventBus } = ctx;

  socket.on(EVENTS.CREATE_CHARACTER, async ({ name, characterClass }) => {
    const accountId = socket.data.accountId;
    if (!accountId) {
      socket.emit(EVENTS.ERROR, { message: 'Not authenticated' });
      return;
    }

    if (!CHARACTER_CLASSES[characterClass]) {
      socket.emit(EVENTS.ERROR, { message: 'Invalid character class' });
      return;
    }

    const playerName = sanitizePlayerName(name);
    if (!playerName) {
      socket.emit(EVENTS.ERROR, { message: 'Character name is required' });
      return;
    }

    if (!(await characterStore.canCreate(accountId))) {
      socket.emit(EVENTS.ERROR, { message: 'Character limit reached' });
      return;
    }

    if (await characterStore.exists(playerName)) {
      socket.emit(EVENTS.ERROR, { message: 'Character name already exists' });
      return;
    }

    const town = world.getMap(DEFAULT_MAP_ID);
    const data = createNewCharacterData(playerName, characterClass, town.spawn);
    const saved = await characterStore.saveData(data, accountId);
    if (!saved) {
      socket.emit(EVENTS.ERROR, { message: 'Could not create character' });
      return;
    }

    socket.emit(EVENTS.CHARACTER_CREATED, {
      name: playerName,
      characterClass,
      level: 1,
    });
  });

  socket.on(EVENTS.DELETE_CHARACTER, async ({ name }) => {
    const accountId = socket.data.accountId;
    if (!accountId) return;

    const playerName = sanitizePlayerName(name);
    if (!playerName) return;

    const inGame = !!playerManager.findByName(playerName);
    if (inGame) {
      socket.emit(EVENTS.ERROR, { message: 'Cannot delete a character that is in game' });
      return;
    }

    if (!(await characterStore.owns(playerName, accountId))) {
      socket.emit(EVENTS.ERROR, { message: 'Character not found' });
      return;
    }

    await characterStore.remove(playerName, accountId);
    socket.emit(EVENTS.CHARACTERS_CHANGED, { name: playerName });
  });

  socket.on(EVENTS.JOIN, async ({ name }) => {
    const accountId = socket.data.accountId;
    if (!accountId) {
      socket.emit(EVENTS.ERROR, { message: 'Not authenticated' });
      return;
    }

    const playerName = sanitizePlayerName(name);
    if (!playerName) {
      socket.emit(EVENTS.ERROR, { message: 'Character name is required' });
      return;
    }

    const saved = await characterStore.load(playerName, accountId);
    if (!saved?.characterClass || !CHARACTER_CLASSES[saved.characterClass]) {
      socket.emit(EVENTS.ERROR, { message: 'Character not found' });
      return;
    }

    const characterClass = saved.characterClass;
    const town = world.getMap(MAP_ID.TOWN) ?? world.getMap(DEFAULT_MAP_ID);
    const townMapId = town?.mapId ?? MAP_ID.TOWN;

    await evictCharacterSessions(ctx, {
      playerName,
      keepSocketId: socket.id,
    });

    const player = playerManager.create({
      id: socket.id,
      name: playerName,
      characterClass,
      spawn: town.spawn,
      map: town,
      saved,
      mapId: townMapId,
      forceSpawn: true,
    });

    player.accountId = accountId;
    logGameEvent('player_join', { playerId: socket.id, name: playerName, mapId: townMapId });

    player.aimX = player.x + 1;
    player.aimY = player.y;
    syncDeathState(player);

    await persistPlayer(characterStore, player);

    broadcastAll({ teleportedIds: new Set([socket.id]) });
    ctx.notifyPlayerJoined(socket.id);
  });

  socket.on(EVENTS.RESPAWN, async () => {
    const player = playerManager.get(socket.id);
    if (!player?.dead) return;

    const town = world.getMap(MAP_ID.TOWN);
    respawnPlayer(player, town);
    await persistPlayer(characterStore, player);
    broadcastAll({ teleportedIds: new Set([socket.id]) });
  });

  socket.on(EVENTS.USE_PORTAL, async ({ portalId }) => {
    const player = getLivingPlayer(playerManager, socket.id);
    if (!player || typeof portalId !== 'string') return;

    interruptTownRecall(player);

    const result = usePortal({ world, player, portalId });
    if (!result.ok) {
      if (result.reason === 'out_of_range') return;
      socket.emit(EVENTS.ERROR, { message: 'Cannot use portal' });
      return;
    }

    emitPlayerTeleported(eventBus, player, result.mapId, 'portal');

    await persistPlayer(characterStore, player);
    broadcastAll({ teleportedIds: new Set([socket.id]) });
  });

  socket.on(EVENTS.CAST_TOWN_RECALL, () => {
    const player = getLivingPlayer(playerManager, socket.id);
    if (!player) return;

    const { map } = getPlayerContext(world, player);
    const result = startTownRecall(player, map);
    if (!result.ok && result.reason !== 'already_casting') return;

    broadcastAll();
  });

  socket.on(EVENTS.AIM, ({ x, y }) => {
    const player = getLivingPlayer(playerManager, socket.id);
    if (!player) return;

    if (updatePlayerAim(player, x, y)) {
      broadcastAll();
    }
  });

  socket.on(EVENTS.MOVE, ({ direction }) => {
    const player = getLivingPlayer(playerManager, socket.id);
    if (!player || !isValidDirection(direction)) return;

    if (isStunned(player)) return;

    const now = Date.now();
    const moveCheck = validatePlayerMove(player, direction, now);
    if (!moveCheck.ok) {
      logGameEvent('move_rejected', {
        playerId: socket.id,
        name: player.name,
        reason: moveCheck.reason,
        direction,
        x: player.x,
        y: player.y,
        lastMoveAt: player.lastMoveAt ?? 0,
      });
      return;
    }

    interruptTownRecall(player);

    const { map } = getPlayerContext(world, player);
    const delta = moveCheck.delta;

    const nextX = player.x + delta.x;
    const nextY = player.y + delta.y;

    if (canMoveTo(map, nextX, nextY)) {
      player.x = nextX;
      player.y = nextY;
      player.direction = direction;
      player.moving = true;
      player.lastMoveAt = now;
    } else {
      player.moving = false;
      player.direction = direction;
      logGameEvent(
        'move_blocked',
        {
          playerId: socket.id,
          name: player.name,
          direction,
          x: player.x,
          y: player.y,
          nextX,
          nextY,
          mapId: player.mapId ?? null,
        },
        { throttleMs: 1000, throttleKey: `move_blocked:${socket.id}` }
      );
    }

    broadcastAll();
  });

  socket.on(EVENTS.DEBUG_LOG, (payload) => {
    if (!isDebugEventsEnabled()) return;
    if (!payload || typeof payload !== 'object') return;
    const { type, ...rest } = payload;
    if (typeof type !== 'string' || type.length === 0 || type.length > 64) return;

    const now = Date.now();
    const bucket = clientDebugRate.get(socket.id) ?? { windowStart: now, count: 0 };
    if (now - bucket.windowStart > 1000) {
      bucket.windowStart = now;
      bucket.count = 0;
    }
    bucket.count += 1;
    clientDebugRate.set(socket.id, bucket);
    if (bucket.count > 30) return;

    logGameEvent(
      type,
      {
        playerId: socket.id,
        name: playerManager.get(socket.id)?.name ?? null,
        ...rest,
      },
      { source: 'client' }
    );
  });
}

/** @param {string} playerId @param {import('../../../shared/plugins/types.js').ServerContext} ctx */
export async function onCoreDisconnect(playerId, ctx) {
  const player = ctx.playerManager.remove(playerId);
  logGameEvent('player_disconnect', {
    playerId,
    name: player?.name ?? null,
  });
  await persistPlayer(ctx.characterStore, player);
  if (player) ctx.broadcastAll();
}
