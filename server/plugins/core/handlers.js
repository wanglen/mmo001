import { EVENTS } from '../../../shared/events.js';
import { CHARACTER_CLASSES } from '../../../shared/constants.js';
import { DIRECTION_DELTA, isValidDirection } from '../../../shared/movement.js';
import { canMoveTo } from '../../map/collision.js';
import { respawnPlayer, syncDeathState } from '../../systems/playerDeath.js';
import { createNewCharacterData } from '../../persistence/CharacterStore.js';
import { usePortal } from '../../systems/zoneTransition.js';
import { startTownRecall, interruptTownRecall } from '../../systems/townHub.js';
import { DEFAULT_MAP_ID, MAP_ID } from '../../../shared/worldMaps.js';
import {
  getLivingPlayer,
  getPlayerContext,
  persistPlayer,
  sanitizePlayerName,
  updatePlayerAim,
} from '../../app/handlerUtils.js';
import { evictCharacterSessions } from './session.js';

export const CORE_EVENTS = [
  EVENTS.CREATE_CHARACTER,
  EVENTS.DELETE_CHARACTER,
  EVENTS.JOIN,
  EVENTS.RESPAWN,
  EVENTS.USE_PORTAL,
  EVENTS.CAST_TOWN_RECALL,
  EVENTS.AIM,
  EVENTS.MOVE,
];

/** @param {import('socket.io').Socket} socket @param {import('../../../shared/plugins/types.js').ServerContext} ctx */
export function registerCoreHandlers(socket, ctx) {
  const { io, world, playerManager, characterStore, broadcastAll } = ctx;

  socket.on(EVENTS.CREATE_CHARACTER, async ({ name, characterClass }) => {
    if (!CHARACTER_CLASSES[characterClass]) {
      socket.emit(EVENTS.ERROR, { message: 'Invalid character class' });
      return;
    }

    const playerName = sanitizePlayerName(name);
    if (!playerName) {
      socket.emit(EVENTS.ERROR, { message: 'Character name is required' });
      return;
    }

    if (await characterStore.exists(playerName)) {
      socket.emit(EVENTS.ERROR, { message: 'Character name already exists' });
      return;
    }

    const town = world.getMap(DEFAULT_MAP_ID);
    const data = createNewCharacterData(playerName, characterClass, town.spawn);
    await characterStore.saveData(data);
    socket.emit(EVENTS.CHARACTER_CREATED, {
      name: playerName,
      characterClass,
      level: 1,
    });
  });

  socket.on(EVENTS.DELETE_CHARACTER, async ({ name }) => {
    const playerName = sanitizePlayerName(name);
    if (!playerName) return;

    const inGame = !!playerManager.findByName(playerName);
    if (inGame) {
      socket.emit(EVENTS.ERROR, { message: 'Cannot delete a character that is in game' });
      return;
    }

    if (!(await characterStore.exists(playerName))) {
      socket.emit(EVENTS.ERROR, { message: 'Character not found' });
      return;
    }

    await characterStore.remove(playerName);
    socket.emit(EVENTS.CHARACTERS_CHANGED, { name: playerName });
  });

  socket.on(EVENTS.JOIN, async ({ name }) => {
    const playerName = sanitizePlayerName(name);
    if (!playerName) {
      socket.emit(EVENTS.ERROR, { message: 'Character name is required' });
      return;
    }

    const saved = await characterStore.load(playerName);
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

    interruptTownRecall(player);

    const { map } = getPlayerContext(world, player);
    const delta = DIRECTION_DELTA[direction];

    const nextX = player.x + delta.x;
    const nextY = player.y + delta.y;

    if (canMoveTo(map, nextX, nextY)) {
      player.x = nextX;
      player.y = nextY;
      player.direction = direction;
      player.moving = true;
      player.lastMoveAt = Date.now();
    } else {
      player.moving = false;
      player.direction = direction;
    }

    broadcastAll();
  });
}

/** @param {string} playerId @param {import('../../../shared/plugins/types.js').ServerContext} ctx */
export async function onCoreDisconnect(playerId, ctx) {
  const player = ctx.playerManager.remove(playerId);
  await persistPlayer(ctx.characterStore, player);
  if (player) ctx.broadcastAll();
}
