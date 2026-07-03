import { EVENTS } from '../../shared/events.js';
import { CHARACTER_CLASSES, MOVE_SPEED } from '../../shared/constants.js';
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

// Future multiplayer: replace socket.emit with io.emit in this helper
function broadcastWorldState(_io, socket, map, playerManager) {
  sendWorldState(socket, map, playerManager);
}

export function registerSocketHandlers(io, map, playerManager) {
  io.on('connection', (socket) => {
    socket.on(EVENTS.JOIN, ({ characterClass, name }) => {
      if (!CHARACTER_CLASSES[characterClass]) {
        socket.emit(EVENTS.ERROR, { message: 'Invalid character class' });
        return;
      }

      const playerName = (name || 'Hero').trim().slice(0, 20) || 'Hero';

      playerManager.create({
        id: socket.id,
        name: playerName,
        characterClass,
        spawn: map.spawn,
      });

      sendWorldState(socket, map, playerManager);
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
