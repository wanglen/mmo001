import { io } from '/socket.io/socket.io.esm.min.js';
import { EVENTS } from '/shared/events.js';

export class SocketClient {
  constructor() {
    this.socket = io();
    this.onWorldStateCallback = null;
    this.onErrorCallback = null;
    this.onCharacterCreatedCallback = null;
    this.onCharactersChangedCallback = null;
    this.onChatMessageCallback = null;
    this.onOnlinePlayersCallback = null;
    this.onPartyStateCallback = null;
    this.onDisconnectCallback = null;
    this.onSessionEndCallback = null;

    this.socket.on(EVENTS.WORLD_STATE, (state) => {
      if (this.onWorldStateCallback) this.onWorldStateCallback(state);
    });

    this.socket.on(EVENTS.ERROR, (err) => {
      if (this.onErrorCallback) this.onErrorCallback(err);
    });

    this.socket.on(EVENTS.CHARACTER_CREATED, (data) => {
      if (this.onCharacterCreatedCallback) this.onCharacterCreatedCallback(data);
    });

    this.socket.on(EVENTS.CHARACTERS_CHANGED, (data) => {
      if (this.onCharactersChangedCallback) this.onCharactersChangedCallback(data);
    });

    this.socket.on(EVENTS.CHAT_MESSAGE, (msg) => {
      if (this.onChatMessageCallback) this.onChatMessageCallback(msg);
    });

    this.socket.on(EVENTS.ONLINE_PLAYERS, (payload) => {
      if (this.onOnlinePlayersCallback) this.onOnlinePlayersCallback(payload);
    });

    this.socket.on(EVENTS.PARTY_STATE, (state) => {
      if (this.onPartyStateCallback) this.onPartyStateCallback(state);
    });

    this.socket.on('disconnect', () => {
      if (this.onDisconnectCallback) this.onDisconnectCallback();
    });

    this.socket.on(EVENTS.SESSION_END, (payload) => {
      if (this.onSessionEndCallback) this.onSessionEndCallback(payload);
    });
  }

  onWorldState(callback) {
    this.onWorldStateCallback = callback;
  }

  onError(callback) {
    this.onErrorCallback = callback;
  }

  onCharacterCreated(callback) {
    this.onCharacterCreatedCallback = callback;
  }

  onCharactersChanged(callback) {
    this.onCharactersChangedCallback = callback;
  }

  createCharacter({ name, characterClass }) {
    this.socket.emit(EVENTS.CREATE_CHARACTER, { name, characterClass });
  }

  deleteCharacter({ name }) {
    this.socket.emit(EVENTS.DELETE_CHARACTER, { name });
  }

  sendMove(direction) {
    this.socket.emit(EVENTS.MOVE, { direction });
  }

  sendAim({ x, y }) {
    this.socket.emit(EVENTS.AIM, { x, y });
  }

  sendAttack(targetId) {
    this.socket.emit(EVENTS.ATTACK, { targetId });
  }

  sendPickup(lootId) {
    this.socket.emit(EVENTS.PICKUP, { lootId });
  }

  sendEquip(inventoryIndex) {
    this.socket.emit(EVENTS.EQUIP, { inventoryIndex });
  }

  sendUnequip(slot) {
    this.socket.emit(EVENTS.UNEQUIP, { slot });
  }

  sendDestroyItem({ inventoryIndex, slot } = {}) {
    this.socket.emit(EVENTS.DESTROY_ITEM, { inventoryIndex, slot });
  }

  sendAllocateStat(stat) {
    this.socket.emit(EVENTS.ALLOCATE_STAT, { stat });
  }

  sendUseSkill({ skillId, targetX, targetY, targetId }) {
    this.socket.emit(EVENTS.USE_SKILL, { skillId, targetX, targetY, targetId });
  }

  sendUseConsumable(inventoryIndex) {
    this.socket.emit(EVENTS.USE_CONSUMABLE, { inventoryIndex });
  }

  sendRespawn() {
    this.socket.emit(EVENTS.RESPAWN);
  }

  sendUsePortal(portalId) {
    this.socket.emit(EVENTS.USE_PORTAL, { portalId });
  }

  sendCastTownRecall() {
    this.socket.emit(EVENTS.CAST_TOWN_RECALL);
  }

  sendNpcInteract(npcId) {
    this.socket.emit(EVENTS.NPC_INTERACT, { npcId });
  }

  sendQuestAccept(questId, npcId) {
    this.socket.emit(EVENTS.QUEST_ACCEPT, { questId, npcId });
  }

  sendQuestTurnIn(questId, npcId) {
    this.socket.emit(EVENTS.QUEST_TURN_IN, { questId, npcId });
  }

  sendChat({ text, channel }) {
    this.socket.emit(EVENTS.CHAT_SEND, { text, channel });
  }

  sendPartyInvite(targetName) {
    this.socket.emit(EVENTS.PARTY_INVITE, { targetName });
  }

  sendPartyAccept() {
    this.socket.emit(EVENTS.PARTY_ACCEPT);
  }

  sendPartyDecline() {
    this.socket.emit(EVENTS.PARTY_DECLINE);
  }

  sendPartyLeave() {
    this.socket.emit(EVENTS.PARTY_LEAVE);
  }

  onChatMessage(callback) {
    this.onChatMessageCallback = callback;
  }

  onOnlinePlayers(callback) {
    this.onOnlinePlayersCallback = callback;
  }

  onPartyState(callback) {
    this.onPartyStateCallback = callback;
  }

  onDisconnect(callback) {
    this.onDisconnectCallback = callback;
  }

  onSessionEnd(callback) {
    this.onSessionEndCallback = callback;
  }

  isConnected() {
    return this.socket.connected;
  }

  /** Server-initiated disconnect disables auto-reconnect; call before join. */
  ensureConnected(timeoutMs = 8000) {
    if (this.socket.connected) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.socket.off('connect', onConnect);
        reject(new Error('Could not connect to server'));
      }, timeoutMs);

      const onConnect = () => {
        clearTimeout(timeout);
        resolve();
      };

      this.socket.once('connect', onConnect);
      this.socket.connect();
    });
  }

  async join({ name }) {
    await this.ensureConnected();
    this.sendJoin(name);
  }

  sendJoin(name) {
    this.socket.emit(EVENTS.JOIN, { name });
  }
}
