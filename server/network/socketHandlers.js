import { EVENTS } from '../../shared/events.js';
import { CHARACTER_CLASSES, MOVE_SPEED } from '../../shared/constants.js';
import { facingFromTarget } from '../../shared/aim.js';
import { canMoveTo } from '../map/collision.js';

const DIRECTION_DELTA = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function buildWorldState(map, playerManager, playerId) {
  const player = playerManager.get(playerId);
  return {
    map: {
      tiles: map.tiles,
      width: map.width,
      height: map.height,
      spawn: map.spawn,
    },
    player: player ? player.toJSON() : null,
    players: playerManager.getAll(),
  };
}

function sendWorldState(socket, map, playerManager) {
  socket.emit(EVENTS.WORLD_STATE, buildWorldState(map, playerManager, socket.id));
}

function broadcastWorldState(_io, socket, map, playerManager) {
  sendWorldState(socket, map, playerManager);
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

export function registerSocketHandlers(io, map, playerManager) {
  io.on('connection', (socket) => {
    socket.on(EVENTS.JOIN, ({ characterClass, name }) => {
      if (!CHARACTER_CLASSES[characterClass]) {
        socket.emit(EVENTS.ERROR, { message: 'Invalid character class' });
        return;
      }

      const playerName = (name || 'Hero').trim().slice(0, 20) || 'Hero';

      const player = playerManager.create({
        id: socket.id,
        name: playerName,
        characterClass,
        spawn: map.spawn,
      });

      player.aimX = player.x + 1;
      player.aimY = player.y;

      sendWorldState(socket, map, playerManager);
    });

    socket.on(EVENTS.AIM, ({ x, y }) => {
      const player = playerManager.get(socket.id);
      if (!player) return;

      if (updatePlayerAim(player, x, y)) {
        broadcastWorldState(io, socket, map, playerManager);
      }
    });

    socket.on(EVENTS.MOVE, ({ direction }) => {
      const player = playerManager.get(socket.id);
      if (!player) return;

      const delta = DIRECTION_DELTA[direction];
      if (!delta) return;

      const nextX = player.x + delta.x * MOVE_SPEED;
      const nextY = player.y + delta.y * MOVE_SPEED;

      if (canMoveTo(map, nextX, nextY)) {
        player.x = nextX;
        player.y = nextY;
        player.direction = direction;
        player.moving = true;
      } else {
        player.moving = false;
        player.direction = direction;
      }

      broadcastWorldState(io, socket, map, playerManager);
    });

    socket.on('disconnect', () => {
      playerManager.remove(socket.id);
    });
  });
}
