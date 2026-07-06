import path from 'path';
import { EVENTS } from '../../shared/events.js';
import { CHARACTER_CLASSES } from '../../shared/constants.js';
import { facingFromTarget } from '../../shared/aim.js';
import { DIRECTION_DELTA, isValidDirection } from '../../shared/movement.js';
import { canMoveTo } from '../map/collision.js';
import { processAttack, clearAttackAnim } from '../systems/combat.js';
import { processSkill, clearSkillAnim, collectActiveSkillFx } from '../systems/skills.js';
import { collectCombatFx } from '../systems/combatFx.js';
import { pickupLoot, equipFromInventory, unequipSlot, useConsumableFromInventory, destroyFromInventory, destroyFromEquipment } from '../systems/inventory.js';
import { allocateStat } from '../systems/progression.js';
import { respawnPlayer, syncDeathState } from '../systems/playerDeath.js';
import { isPlayerAlive } from '../../shared/playerLife.js';
import { createNewCharacterData } from '../persistence/CharacterStore.js';
import { usePortal } from '../systems/zoneTransition.js';
import { startTownRecall, interruptTownRecall } from '../systems/townHub.js';
import {
  acceptQuestForPlayer,
  interactWithNpc,
  turnInQuestForPlayer,
} from '../systems/quests.js';
import { DEFAULT_MAP_ID, MAP_ID } from '../../shared/worldMaps.js';
import { npcToJSON } from '../../shared/npcs.js';
import { serializeRemotePlayers } from '../../shared/playerSync.js';
import { APP_VERSION } from '../version.js';
import {
  onPlayerDisconnectedSocial,
  onPlayerJoinedSocial,
} from './socialHandlers.js';
import { onPlayerDisconnectedEconomy } from './economyHandlers.js';

function sanitizePlayerName(name) {
  return (name || '').trim().slice(0, 20);
}

function playerMapId(player) {
  return player?.mapId ?? DEFAULT_MAP_ID;
}

function serializePortals(portals = []) {
  return portals.map(({ id, label, x, y, targetMapId }) => ({
    id,
    label,
    x,
    y,
    targetMapId,
  }));
}

function buildWorldState(world, playerManager, playerId, { includeMapTiles = true } = {}) {
  const now = Date.now();
  const player = playerManager.get(playerId);
  if (player) {
    clearAttackAnim(player, now);
    clearSkillAnim(player, now);
  }

  const mapId = playerMapId(player);
  const { map, monsterManager, lootManager } = world.getContext(mapId);

  const mapPayload = {
    mapId: map.mapId ?? mapId,
    width: map.width,
    height: map.height,
    spawn: map.spawn,
    zones: map.zones ?? [],
    portals: serializePortals(map.portals),
  };
  if (includeMapTiles) {
    mapPayload.tiles = map.tiles;
  }

  const sameMapPlayers = playerManager
    .getAllEntities()
    .filter((entry) => playerMapId(entry) === mapId);

  return {
    version: APP_VERSION,
    map: mapPayload,
    player: player ? player.toJSON(now) : null,
    players: serializeRemotePlayers(sameMapPlayers, playerId, now),
    monsters: monsterManager.getAll(),
    loot: lootManager.getAllForViewer(playerId, now),
    npcs: (map.npcs ?? map.npcsJson ?? []).map((entry) =>
      entry.dialogue ? entry : npcToJSON(entry)
    ),
    skillFx: collectActiveSkillFx(playerManager, now),
    combatFx: collectCombatFx(now),
  };
}

function broadcastWorldState(io, world, playerManager, { fullMapSocketIds = null } = {}) {
  const now = Date.now();
  for (const player of playerManager.getAllEntities()) {
    clearAttackAnim(player, now);
    clearSkillAnim(player, now);
  }
  for (const [socketId, socket] of io.sockets.sockets) {
    socket.emit(
      EVENTS.WORLD_STATE,
      buildWorldState(world, playerManager, socketId, {
        includeMapTiles: fullMapSocketIds?.has(socketId) ?? false,
      })
    );
  }
}

function broadcastAll(io, world, playerManager, { fullMapSocketIds = null } = {}) {
  broadcastWorldState(io, world, playerManager, { fullMapSocketIds });
}

function updatePlayerAim(player, x, y) {
  if (typeof x !== 'number' || typeof y !== 'number' || !Number.isFinite(x) || !Number.isFinite(y)) {
    return false;
  }

  player.aimX = x;
  player.aimY = y;

  const facing = facingFromTarget(player.x, player.y, x, y);
  if (facing) player.facing = facing;

  return true;
}

async function persistPlayers(characterStore, playerManager, playerIds = []) {
  for (const playerId of playerIds) {
    const entry = playerManager.get(playerId);
    if (entry) await characterStore.save(entry);
  }
}

async function persistPlayer(characterStore, player) {
  if (player) await characterStore.save(player);
}

function getLivingPlayer(playerManager, socketId) {
  const player = playerManager.get(socketId);
  if (!player || !isPlayerAlive(player)) return null;
  return player;
}

function getPlayerContext(world, player) {
  return world.getContextForPlayer(player);
}

const SESSION_REPLACED_MSG = 'This character logged in from another session.';

/** Remove every in-game session for this character name; disconnect other clients. */
async function evictCharacterSessions({
  io,
  world,
  playerManager,
  characterStore,
  partyManager,
  playerName,
  keepSocketId,
}) {
  const needle = sanitizePlayerName(playerName).toLowerCase();
  if (!needle) return;

  const matches = playerManager
    .getAllEntities()
    .filter((entry) => entry.name.toLowerCase() === needle);

  if (!matches.length) return;

  for (const entity of matches) {
    onPlayerDisconnectedSocial(io, playerManager, partyManager, entity.id);
    await persistPlayer(characterStore, entity);
    playerManager.remove(entity.id);

    if (entity.id === keepSocketId) continue;

    const oldSocket = io.sockets.sockets.get(entity.id);
    if (oldSocket) {
      oldSocket.emit(EVENTS.SESSION_END, { message: SESSION_REPLACED_MSG });
      oldSocket.disconnect(true);
    }
  }

  broadcastAll(io, world, playerManager);
}

export function registerSocketHandlers(io, world, playerManager, characterStore, partyManager, tradeManager) {
  io.on('connection', (socket) => {
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
      const mapId = saved.mapId ?? DEFAULT_MAP_ID;
      const map = world.getMap(mapId) ?? world.getMap(DEFAULT_MAP_ID);
      const resolvedMapId = map?.mapId ?? DEFAULT_MAP_ID;

      await evictCharacterSessions({
        io,
        world,
        playerManager,
        characterStore,
        partyManager,
        playerName,
        keepSocketId: socket.id,
      });

      const player = playerManager.create({
        id: socket.id,
        name: playerName,
        characterClass,
        spawn: map.spawn,
        map,
        saved,
        mapId: resolvedMapId,
      });

      player.aimX = player.x + 1;
      player.aimY = player.y;
      syncDeathState(player);

      broadcastAll(io, world, playerManager, { fullMapSocketIds: new Set([socket.id]) });
      onPlayerJoinedSocial(io, playerManager, partyManager, socket.id);
    });

    socket.on(EVENTS.RESPAWN, async () => {
      const player = playerManager.get(socket.id);
      if (!player?.dead) return;

      const town = world.getMap(MAP_ID.TOWN);
      respawnPlayer(player, town);
      await persistPlayer(characterStore, player);
      broadcastAll(io, world, playerManager, { fullMapSocketIds: new Set([socket.id]) });
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
      broadcastAll(io, world, playerManager, { fullMapSocketIds: new Set([socket.id]) });
    });

    socket.on(EVENTS.CAST_TOWN_RECALL, () => {
      const player = getLivingPlayer(playerManager, socket.id);
      if (!player) return;

      const { map } = getPlayerContext(world, player);
      const result = startTownRecall(player, map);
      if (!result.ok && result.reason !== 'already_casting') return;

      broadcastAll(io, world, playerManager);
    });

    socket.on(EVENTS.NPC_INTERACT, async ({ npcId }) => {
      const player = getLivingPlayer(playerManager, socket.id);
      if (!player || typeof npcId !== 'string') return;

      const { map } = getPlayerContext(world, player);
      const npcs = map.npcs ?? map.npcsJson ?? [];
      const result = interactWithNpc(player, npcs, npcId);
      if (!result.ok) return;

      await persistPlayer(characterStore, player);
      broadcastAll(io, world, playerManager);
    });

    socket.on(EVENTS.QUEST_ACCEPT, async ({ questId, npcId }) => {
      const player = getLivingPlayer(playerManager, socket.id);
      if (!player || typeof questId !== 'string' || typeof npcId !== 'string') return;

      const result = acceptQuestForPlayer(player, questId, npcId);
      if (!result.ok) {
        socket.emit(EVENTS.ERROR, { message: 'Cannot accept quest' });
        return;
      }

      await persistPlayer(characterStore, player);
      broadcastAll(io, world, playerManager);
    });

    socket.on(EVENTS.QUEST_TURN_IN, async ({ questId, npcId }) => {
      const player = getLivingPlayer(playerManager, socket.id);
      if (!player || typeof questId !== 'string' || typeof npcId !== 'string') return;

      const result = turnInQuestForPlayer(player, questId, npcId);
      if (!result.ok) {
        socket.emit(EVENTS.ERROR, { message: 'Cannot turn in quest' });
        return;
      }

      await persistPlayer(characterStore, player);
      broadcastAll(io, world, playerManager);
    });

    socket.on(EVENTS.AIM, ({ x, y }) => {
      const player = getLivingPlayer(playerManager, socket.id);
      if (!player) return;

      if (updatePlayerAim(player, x, y)) {
        broadcastAll(io, world, playerManager);
      }
    });

    socket.on(EVENTS.ATTACK, async ({ targetId }) => {
      const player = getLivingPlayer(playerManager, socket.id);
      if (!player || typeof targetId !== 'string') return;

      interruptTownRecall(player);

      const { map, monsterManager, lootManager } = getPlayerContext(world, player);
      const result = processAttack({
        player,
        targetId,
        monsterManager,
        lootManager,
        map,
        partyManager,
        playerManager,
      });
      if (!result.ok && result.reason === 'cooldown') return;

      if (result.ok) {
        const saveIds = result.xpRecipientIds?.length ? result.xpRecipientIds : [player.id];
        await persistPlayers(characterStore, playerManager, saveIds);
      }
      broadcastAll(io, world, playerManager);
    });

    socket.on(EVENTS.USE_SKILL, async ({ skillId, targetX, targetY, targetId }) => {
      const player = getLivingPlayer(playerManager, socket.id);
      if (!player || typeof skillId !== 'string') return;

      interruptTownRecall(player);

      const { map, monsterManager, lootManager } = getPlayerContext(world, player);
      const result = processSkill({
        player,
        skillId,
        targetX,
        targetY,
        targetId,
        monsterManager,
        lootManager,
        map,
        partyManager,
        playerManager,
      });

      if (!result.ok && (result.reason === 'cooldown' || result.reason === 'no_mp')) return;

      if (result.ok) {
        const killIds = (result.hits ?? [])
          .filter((hit) => hit.killed && hit.xpRecipientIds?.length)
          .flatMap((hit) => hit.xpRecipientIds);
        const saveIds = killIds.length ? [...new Set(killIds)] : [player.id];
        await persistPlayers(characterStore, playerManager, saveIds);
      }
      broadcastAll(io, world, playerManager);
    });

    socket.on(EVENTS.USE_CONSUMABLE, async ({ inventoryIndex }) => {
      const player = getLivingPlayer(playerManager, socket.id);
      if (!player || !Number.isInteger(inventoryIndex)) return;

      const result = useConsumableFromInventory(player, inventoryIndex);
      if (!result.ok) {
        if (result.reason === 'full_hp' || result.reason === 'full_mp') return;
        socket.emit(EVENTS.ERROR, { message: `Cannot use item: ${result.reason}` });
        return;
      }

      await persistPlayer(characterStore, player);
      broadcastAll(io, world, playerManager);
    });

    socket.on(EVENTS.PICKUP, async ({ lootId }) => {
      const player = getLivingPlayer(playerManager, socket.id);
      if (!player || typeof lootId !== 'string') return;

      interruptTownRecall(player);

      const { lootManager } = getPlayerContext(world, player);
      const result = pickupLoot({ player, lootId, lootManager });
      if (!result.ok) {
        socket.emit(EVENTS.ERROR, { message: `Cannot pick up: ${result.reason}` });
        return;
      }

      await persistPlayer(characterStore, player);
      broadcastAll(io, world, playerManager);
    });

    socket.on(EVENTS.EQUIP, async ({ inventoryIndex }) => {
      const player = getLivingPlayer(playerManager, socket.id);
      if (!player || !Number.isInteger(inventoryIndex)) return;

      const result = equipFromInventory(player, inventoryIndex);
      if (!result.ok) {
        socket.emit(EVENTS.ERROR, { message: `Cannot equip: ${result.reason}` });
        return;
      }

      await persistPlayer(characterStore, player);
      broadcastAll(io, world, playerManager);
    });

    socket.on(EVENTS.UNEQUIP, async ({ slot }) => {
      const player = getLivingPlayer(playerManager, socket.id);
      if (!player || typeof slot !== 'string') return;

      const result = unequipSlot(player, slot);
      if (!result.ok) {
        socket.emit(EVENTS.ERROR, { message: `Cannot unequip: ${result.reason}` });
        return;
      }

      await persistPlayer(characterStore, player);
      broadcastAll(io, world, playerManager);
    });

    socket.on(EVENTS.DESTROY_ITEM, async ({ inventoryIndex, slot }) => {
      const player = getLivingPlayer(playerManager, socket.id);
      if (!player) return;

      const result = Number.isInteger(inventoryIndex)
        ? destroyFromInventory(player, inventoryIndex)
        : typeof slot === 'string'
          ? destroyFromEquipment(player, slot)
          : { ok: false, reason: 'invalid_target' };

      if (!result.ok) {
        socket.emit(EVENTS.ERROR, { message: `Cannot destroy item: ${result.reason}` });
        return;
      }

      await persistPlayer(characterStore, player);
      broadcastAll(io, world, playerManager);
    });

    socket.on(EVENTS.ALLOCATE_STAT, async ({ stat }) => {
      const player = getLivingPlayer(playerManager, socket.id);
      if (!player || typeof stat !== 'string') return;

      const result = allocateStat(player, stat);
      if (!result.ok) {
        socket.emit(EVENTS.ERROR, { message: `Cannot allocate stat: ${result.reason}` });
        return;
      }

      await persistPlayer(characterStore, player);
      broadcastAll(io, world, playerManager);
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

      broadcastAll(io, world, playerManager);
    });

    socket.on('disconnect', async () => {
      const playerId = socket.id;
      onPlayerDisconnectedSocial(io, playerManager, partyManager, playerId);
      onPlayerDisconnectedEconomy(io, tradeManager, playerManager, playerId);
      const player = playerManager.remove(playerId);
      await persistPlayer(characterStore, player);
      if (player) broadcastAll(io, world, playerManager);
    });
  });

  return {
    broadcastAll: ({ teleportedIds = null } = {}) =>
      broadcastWorldState(io, world, playerManager, { fullMapSocketIds: teleportedIds }),
  };
}
