import { MAP_ID } from './worldMaps.js';

export const CHAT_CHANNEL = {
  GLOBAL: 'global',
  ZONE: 'zone',
  WHISPER: 'whisper',
  PARTY: 'party',
  SYSTEM: 'system',
};

export const MAX_CHAT_LENGTH = 200;
export const PARTY_MAX_SIZE = 4;
/** Party members within this pixel distance share kill XP (same map required). */
export const PARTY_XP_SHARE_RANGE = 400;
export const PARTY_INVITE_TTL_MS = 60_000;

export const MAP_LABELS = {
  [MAP_ID.TOWN]: 'Town',
  [MAP_ID.WILDERNESS]: 'Wilderness',
  [MAP_ID.DUNGEON]: 'Dungeon',
  [MAP_ID.FOREST]: 'Dark Forest',
  [MAP_ID.DESERT]: 'Scorched Desert',
};

export function sanitizeChatText(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/\s+/g, ' ').trim().slice(0, MAX_CHAT_LENGTH);
}

export function isValidChatChannel(channel) {
  return Object.values(CHAT_CHANNEL).includes(channel);
}

/** Parse slash commands: /w Name msg, /p msg, /g msg, /z msg */
export function parseChatInput(rawText, defaultChannel = CHAT_CHANNEL.GLOBAL) {
  const text = sanitizeChatText(rawText);
  if (!text) return { ok: false, reason: 'empty' };

  const whisperMatch = text.match(/^\/w(?:hisper)?\s+(\S+)\s+(.+)$/i);
  if (whisperMatch) {
    return {
      ok: true,
      channel: CHAT_CHANNEL.WHISPER,
      targetName: whisperMatch[1],
      text: sanitizeChatText(whisperMatch[2]),
    };
  }

  const partyMatch = text.match(/^\/p(?:arty)?\s+(.+)$/i);
  if (partyMatch) {
    return {
      ok: true,
      channel: CHAT_CHANNEL.PARTY,
      text: sanitizeChatText(partyMatch[1]),
    };
  }

  const globalMatch = text.match(/^\/g(?:lobal)?\s+(.+)$/i);
  if (globalMatch) {
    return {
      ok: true,
      channel: CHAT_CHANNEL.GLOBAL,
      text: sanitizeChatText(globalMatch[1]),
    };
  }

  const zoneMatch = text.match(/^\/z(?:one)?\s+(.+)$/i);
  if (zoneMatch) {
    return {
      ok: true,
      channel: CHAT_CHANNEL.ZONE,
      text: sanitizeChatText(zoneMatch[1]),
    };
  }

  return { ok: true, channel: defaultChannel, text };
}

export function findPlayerByName(players, name) {
  const needle = (name ?? '').trim().toLowerCase();
  if (!needle) return null;
  return players.find((entry) => entry.name?.toLowerCase() === needle) ?? null;
}

export function serializeOnlinePlayer(player) {
  return {
    id: player.id,
    name: player.name,
    characterClass: player.characterClass,
    level: player.level ?? 1,
    mapId: player.mapId,
  };
}

export function buildOnlineList(players) {
  const list = players.map(serializeOnlinePlayer).sort((a, b) => a.name.localeCompare(b.name));
  return { count: list.length, players: list };
}

export function isWithinPartyXpRange(x1, y1, x2, y2, range = PARTY_XP_SHARE_RANGE) {
  return Math.hypot(x2 - x1, y2 - y1) <= range;
}

/**
 * Party members on the same map within range share kill XP with the killer.
 * Solo players receive XP only for themselves.
 */
export function getPartyXpRecipients(killer, partyMemberIds, allPlayers, range = PARTY_XP_SHARE_RANGE) {
  if (!killer) return [];
  if (!partyMemberIds?.length || partyMemberIds.length <= 1) {
    return [killer];
  }

  const recipients = [];
  for (const memberId of partyMemberIds) {
    const member = allPlayers.find((entry) => entry.id === memberId);
    if (!member || member.dead) continue;
    if (member.mapId !== killer.mapId) continue;
    if (
      member.id !== killer.id &&
      !isWithinPartyXpRange(killer.x, killer.y, member.x, member.y, range)
    ) {
      continue;
    }
    recipients.push(member);
  }

  return recipients.length ? recipients : [killer];
}

export function formatChatMessage({ channel, from, text, mapLabel = null, to = null }) {
  return {
    channel,
    from,
    text,
    mapLabel,
    to,
    at: Date.now(),
  };
}

export function chatChannelLabel(channel, mapLabel = null) {
  switch (channel) {
    case CHAT_CHANNEL.GLOBAL:
      return 'Global';
    case CHAT_CHANNEL.ZONE:
      return mapLabel ? `Zone (${mapLabel})` : 'Zone';
    case CHAT_CHANNEL.WHISPER:
      return 'Whisper';
    case CHAT_CHANNEL.PARTY:
      return 'Party';
    case CHAT_CHANNEL.SYSTEM:
      return 'System';
    default:
      return 'Chat';
  }
}
