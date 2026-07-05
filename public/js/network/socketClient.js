import { io } from '/socket.io/socket.io.esm.min.js';
import { EVENTS } from '/shared/events.js';

export class SocketClient {
  constructor() {
    this.socket = io();
    this.onWorldStateCallback = null;
    this.onErrorCallback = null;

    this.socket.on(EVENTS.WORLD_STATE, (state) => {
      if (this.onWorldStateCallback) this.onWorldStateCallback(state);
    });

    this.socket.on(EVENTS.ERROR, (err) => {
      if (this.onErrorCallback) this.onErrorCallback(err);
    });
  }

  onWorldState(callback) {
    this.onWorldStateCallback = callback;
  }

  onError(callback) {
    this.onErrorCallback = callback;
  }

  join({ characterClass, name }) {
    this.socket.emit(EVENTS.JOIN, { characterClass, name });
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
}
