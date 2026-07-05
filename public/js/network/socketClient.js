import { io } from '/socket.io/socket.io.esm.min.js';
import { EVENTS } from '/shared/events.js';

export class SocketClient {
  constructor() {
    this.socket = io();
    this.onWorldStateCallback = null;
    this.onErrorCallback = null;
    this.onCharacterCreatedCallback = null;
    this.onCharactersChangedCallback = null;

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

  join({ name }) {
    this.socket.emit(EVENTS.JOIN, { name });
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
}
