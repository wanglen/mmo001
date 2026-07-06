/** In-process domain events (not Socket.IO). Used by server/plugins via EventBus. */
export const DOMAIN_EVENTS = {
  /** @payload {{ killer: object, monster: object, recipients: object[], partyMemberIds: string[], allPlayers: object[], lootManager?: object, now: number }} */
  MONSTER_KILLED: 'monster:killed',
  /** @payload {{ playerId: string, ctx: object }} */
  PLAYER_DISCONNECT: 'player:disconnect',
  /** @payload {{ player: object, mapId: string, source?: string }} */
  PLAYER_TELEPORTED: 'player:teleported',
};
