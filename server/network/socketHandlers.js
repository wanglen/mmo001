import path from 'path';
import { fileURLToPath } from 'url';
import { EVENTS } from '../../shared/events.js';
import { CHARACTER_CLASSES } from '../../shared/constants.js';
import { facingFromTarget } from '../../shared/aim.js';
import { DIRECTION_DELTA, isValidDirection } from '../../shared/movement.js';
import { canMoveTo } from '../map/collision.js';
import { processAttack, clearAttackAnim } from '../systems/combat.js';
import { pickupLoot, equipFromInventory, unequipSlot } from '../systems/inventory.js';
import { allocateStat } from '../systems/progression.js';
import { CharacterStore } from '../persistence/CharacterStore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', '..', 'data', 'characters');

function buildWorldState(map, playerManager, monsterManager, lootManager, playerId) {
  const player = playerManager.get(playerId);
  if (player) clearAttackAnim(player);

  return {
    map: {
      tiles: map.tiles,
      width: map.width,
      height: map.height,
      spawn: map.spawn,
    },
    player: player ? player.toJSON() : null,
    players: playerManager.getAll(),
    monsters: monsterManager.getAll(),
    loot: lootManager.getAll(),
  };
}

function sendWorldState(socket, map, playerManager, monsterManager, lootManager) {
  socket.emit(
    EVENTS.WORLD_STATE,
    buildWorldState(map, playerManager, monsterManager, lootManager, socket.id)
  );
}

function broadcastWorldState(io, map, playerManager, monsterManager, lootManager) {
  for (const player of playerManager.getAllEntities()) {
    clearAttackAnim(player);
  }
  for (const [socketId, socket] of io.sockets.sockets) {
    socket.emit(
      EVENTS.WORLD_STATE,
      buildWorldState(map, playerManager, monsterManager, lootManager, socketId)
    );
  }
}

function broadcastWorldStateToSocket(io, socket, map, playerManager, monsterManager, lootManager) {
  sendWorldState(socket, map, playerManager, monsterManager, lootManager);
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

async function persistPlayer(characterStore, player) {
  if (player) await characterStore.save(player);
}

export function registerSocketHandlers(io, map, playerManager, monsterManager, lootManager) {
  const characterStore = new CharacterStore(dataDir);

  io.on('connection', (socket) => {
    socket.on(EVENTS.JOIN, async ({ characterClass, name }) => {
      if (!CHARACTER_CLASSES[characterClass]) {
        socket.emit(EVENTS.ERROR, { message: 'Invalid character class' });
        return;
      }

      const playerName = (name || 'Hero').trim().slice(0, 20) || 'Hero';
      const saved = await characterStore.load(playerName, characterClass);

      const player = playerManager.create({
        id: socket.id,
        name: playerName,
        characterClass,
        spawn: map.spawn,
        map,
        saved,
      });

      player.aimX = player.x + 1;
      player.aimY = player.y;

      sendWorldState(socket, map, playerManager, monsterManager, lootManager);
    });

    socket.on(EVENTS.AIM, ({ x, y }) => {
      const player = playerManager.get(socket.id);
      if (!player) return;

      if (updatePlayerAim(player, x, y)) {
        broadcastWorldStateToSocket(io, socket, map, playerManager, monsterManager, lootManager);
      }
    });

    socket.on(EVENTS.ATTACK, async ({ targetId }) => {
      const player = playerManager.get(socket.id);
      if (!player || typeof targetId !== 'string') return;

      const result = processAttack({ player, targetId, monsterManager, lootManager });
      if (!result.ok && result.reason === 'cooldown') return;

      if (result.ok) await persistPlayer(characterStore, player);
      broadcastWorldStateToSocket(io, socket, map, playerManager, monsterManager, lootManager);
    });

    socket.on(EVENTS.PICKUP, async ({ lootId }) => {
      const player = playerManager.get(socket.id);
      if (!player || typeof lootId !== 'string') return;

      const result = pickupLoot({ player, lootId, lootManager });
      if (!result.ok) {
        socket.emit(EVENTS.ERROR, { message: `Cannot pick up: ${result.reason}` });
        return;
      }

      await persistPlayer(characterStore, player);
      broadcastWorldStateToSocket(io, socket, map, playerManager, monsterManager, lootManager);
    });

    socket.on(EVENTS.EQUIP, async ({ inventoryIndex }) => {
      const player = playerManager.get(socket.id);
      if (!player || !Number.isInteger(inventoryIndex)) return;

      const result = equipFromInventory(player, inventoryIndex);
      if (!result.ok) {
        socket.emit(EVENTS.ERROR, { message: `Cannot equip: ${result.reason}` });
        return;
      }

      await persistPlayer(characterStore, player);
      broadcastWorldStateToSocket(io, socket, map, playerManager, monsterManager, lootManager);
    });

    socket.on(EVENTS.UNEQUIP, async ({ slot }) => {
      const player = playerManager.get(socket.id);
      if (!player || typeof slot !== 'string') return;

      const result = unequipSlot(player, slot);
      if (!result.ok) {
        socket.emit(EVENTS.ERROR, { message: `Cannot unequip: ${result.reason}` });
        return;
      }

      await persistPlayer(characterStore, player);
      broadcastWorldStateToSocket(io, socket, map, playerManager, monsterManager, lootManager);
    });

    socket.on(EVENTS.ALLOCATE_STAT, async ({ stat }) => {
      const player = playerManager.get(socket.id);
      if (!player || typeof stat !== 'string') return;

      const result = allocateStat(player, stat);
      if (!result.ok) {
        socket.emit(EVENTS.ERROR, { message: `Cannot allocate stat: ${result.reason}` });
        return;
      }

      await persistPlayer(characterStore, player);
      broadcastWorldStateToSocket(io, socket, map, playerManager, monsterManager, lootManager);
    });

    socket.on(EVENTS.MOVE, ({ direction }) => {
      const player = playerManager.get(socket.id);
      if (!player || !isValidDirection(direction)) return;

      const delta = DIRECTION_DELTA[direction];

      const nextX = player.x + delta.x;
      const nextY = player.y + delta.y;

      if (canMoveTo(map, nextX, nextY)) {
        player.x = nextX;
        player.y = nextY;
        player.direction = direction;
        player.moving = true;
      } else {
        player.moving = false;
        player.direction = direction;
      }

      broadcastWorldStateToSocket(io, socket, map, playerManager, monsterManager, lootManager);
    });

    socket.on('disconnect', async () => {
      const player = playerManager.remove(socket.id);
      await persistPlayer(characterStore, player);
    });
  });

  return {
    broadcastAll: () => broadcastWorldState(io, map, playerManager, monsterManager, lootManager),
  };
}
