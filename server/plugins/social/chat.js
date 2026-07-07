import {
  CHAT_CHANNEL,
  MAP_LABELS,
  findPlayerByName,
  formatChatMessage,
  isValidChatChannel,
  parseChatInput,
  sanitizeChatText,
} from '../../../shared/social.js';

export function resolveChatSend(rawText, defaultChannel, sender, playerManager) {
  const parsed = parseChatInput(rawText, defaultChannel);
  if (!parsed.ok) return parsed;

  const { channel, text, targetName } = parsed;
  if (!text) return { ok: false, reason: 'empty' };
  if (!isValidChatChannel(channel) || channel === CHAT_CHANNEL.SYSTEM) {
    return { ok: false, reason: 'invalid_channel' };
  }

  if (channel === CHAT_CHANNEL.WHISPER) {
    const target = findPlayerByName(playerManager.getAllEntities(), targetName);
    if (!target) return { ok: false, reason: 'player_not_found' };
    if (target.id === sender.id) return { ok: false, reason: 'self' };
    return {
      ok: true,
      channel,
      text,
      recipients: [sender.id, target.id],
      message: formatChatMessage({
        channel,
        from: sender.name,
        to: target.name,
        text,
      }),
    };
  }

  const mapLabel = MAP_LABELS[sender.mapId] ?? sender.mapId;
  const message = formatChatMessage({
    channel,
    from: sender.name,
    text,
    mapLabel: channel === CHAT_CHANNEL.ZONE ? mapLabel : null,
  });

  return { ok: true, channel, text, mapLabel, message };
}

export function getChatRecipients(channel, sender, playerManager, partyManager) {
  const players = playerManager.getAllEntities();

  switch (channel) {
    case CHAT_CHANNEL.GLOBAL:
      return players.map((entry) => entry.id);
    case CHAT_CHANNEL.ZONE:
      return players.filter((entry) => entry.mapId === sender.mapId).map((entry) => entry.id);
    case CHAT_CHANNEL.PARTY: {
      const memberIds = partyManager.getMemberIds(sender.id);
      if (memberIds.length <= 1) return [];
      return memberIds;
    }
    default:
      return [];
  }
}

export function buildSystemChatMessage(text) {
  return formatChatMessage({
    channel: CHAT_CHANNEL.SYSTEM,
    from: 'System',
    text: sanitizeChatText(text),
  });
}
