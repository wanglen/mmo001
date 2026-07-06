import { EVENTS } from '../../shared/events.js';
import {
  CHAT_CHANNEL,
  buildOnlineList,
  isValidChatChannel,
} from '../../shared/social.js';
import { buildSystemChatMessage, getChatRecipients, resolveChatSend } from '../systems/chat.js';

function emitToPlayerIds(io, playerIds, event, payload) {
  for (const playerId of playerIds) {
    io.to(playerId).emit(event, payload);
  }
}

export function broadcastOnlinePlayers(io, playerManager) {
  io.emit(EVENTS.ONLINE_PLAYERS, buildOnlineList(playerManager.getAllEntities()));
}

export function emitPartyState(io, partyManager, playerManager, playerIds) {
  for (const playerId of playerIds) {
    const socket = io.sockets.sockets.get(playerId);
    if (!socket) continue;
    socket.emit(EVENTS.PARTY_STATE, partyManager.getPartyStateForPlayer(playerId, playerManager));
  }
}

export function registerSocialHandlers(io, playerManager, partyManager) {
  io.on('connection', (socket) => {
    socket.on(EVENTS.CHAT_SEND, ({ text, channel = CHAT_CHANNEL.GLOBAL }) => {
      const sender = playerManager.get(socket.id);
      if (!sender) return;

      const defaultChannel = isValidChatChannel(channel) ? channel : CHAT_CHANNEL.GLOBAL;
      const resolved = resolveChatSend(text, defaultChannel, sender, playerManager);
      if (!resolved.ok) {
        if (resolved.reason === 'player_not_found') {
          socket.emit(EVENTS.CHAT_MESSAGE, buildSystemChatMessage('Player not found.'));
        }
        return;
      }

      if (resolved.channel === CHAT_CHANNEL.WHISPER) {
        emitToPlayerIds(io, resolved.recipients, EVENTS.CHAT_MESSAGE, resolved.message);
        return;
      }

      if (resolved.channel === CHAT_CHANNEL.PARTY) {
        const recipients = getChatRecipients(resolved.channel, sender, playerManager, partyManager);
        if (!recipients.length) {
          socket.emit(EVENTS.CHAT_MESSAGE, buildSystemChatMessage('You are not in a party.'));
          return;
        }
        emitToPlayerIds(io, recipients, EVENTS.CHAT_MESSAGE, resolved.message);
        return;
      }

      const recipients = getChatRecipients(resolved.channel, sender, playerManager, partyManager);
      emitToPlayerIds(io, recipients, EVENTS.CHAT_MESSAGE, resolved.message);
    });

    socket.on(EVENTS.PARTY_INVITE, ({ targetName }) => {
      const inviter = playerManager.get(socket.id);
      if (!inviter || typeof targetName !== 'string') return;

      const target = playerManager
        .getAllEntities()
        .find((entry) => entry.name?.toLowerCase() === targetName.trim().toLowerCase());
      if (!target) {
        socket.emit(EVENTS.ERROR, { message: 'Player not found' });
        return;
      }

      const result = partyManager.invite(inviter, target);
      if (!result.ok) {
        const messages = {
          self: 'You cannot invite yourself.',
          target_in_party: 'That player is already in a party.',
          already_invited: 'That player already has a pending invite.',
          not_leader: 'Only the party leader can invite.',
          party_full: 'Your party is full.',
        };
        socket.emit(EVENTS.ERROR, { message: messages[result.reason] ?? 'Cannot invite player' });
        return;
      }

      emitPartyState(io, partyManager, playerManager, [
        ...partyManager.getAffectedPlayerIds(inviter.id),
        target.id,
      ]);
      target.id &&
        io.to(target.id).emit(
          EVENTS.CHAT_MESSAGE,
          buildSystemChatMessage(`${inviter.name} invited you to a party.`)
        );
    });

    socket.on(EVENTS.PARTY_ACCEPT, () => {
      const player = playerManager.get(socket.id);
      if (!player) return;

      const result = partyManager.accept(player);
      if (!result.ok) {
        socket.emit(EVENTS.ERROR, { message: 'No party invite to accept' });
        return;
      }

      const affected = new Set(result.memberIds);
      for (const memberId of result.memberIds) {
        for (const id of partyManager.getAffectedPlayerIds(memberId)) {
          affected.add(id);
        }
      }
      emitPartyState(io, partyManager, playerManager, [...affected]);
      io.to(socket.id).emit(
        EVENTS.CHAT_MESSAGE,
        buildSystemChatMessage('You joined the party.')
      );
    });

    socket.on(EVENTS.PARTY_DECLINE, () => {
      const player = playerManager.get(socket.id);
      if (!player) return;

      const invite = partyManager.pendingInvites.get(player.id);
      const fromId = invite?.fromId;
      const result = partyManager.decline(player);
      if (!result.ok) return;

      const affected = [player.id];
      if (fromId) affected.push(fromId);
      emitPartyState(io, partyManager, playerManager, affected);
    });

    socket.on(EVENTS.PARTY_LEAVE, () => {
      const player = playerManager.get(socket.id);
      if (!player) return;

      const memberIds = partyManager.getMemberIds(player.id);
      const result = partyManager.leave(player);
      if (!result.ok) {
        socket.emit(EVENTS.ERROR, { message: 'You are not in a party' });
        return;
      }

      const affected = new Set([player.id, ...memberIds]);
      emitPartyState(io, partyManager, playerManager, [...affected]);
      socket.emit(EVENTS.CHAT_MESSAGE, buildSystemChatMessage('You left the party.'));
    });
  });
}

export function onPlayerJoinedSocial(io, playerManager, partyManager, socketId) {
  broadcastOnlinePlayers(io, playerManager);
  io.to(socketId).emit(EVENTS.PARTY_STATE, partyManager.getPartyStateForPlayer(socketId, playerManager));
}

export function onPlayerDisconnectedSocial(io, playerManager, partyManager, playerId) {
  const affected = partyManager.getAffectedPlayerIds(playerId);
  partyManager.onDisconnect(playerId);
  broadcastOnlinePlayers(io, playerManager);
  if (affected.length) {
    emitPartyState(io, partyManager, playerManager, affected.filter((id) => id !== playerId));
  }
}
