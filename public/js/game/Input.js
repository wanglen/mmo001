import { directionFromKeys } from '/shared/movement.js';

const GAME_SHORTCUT_KEYS = new Set(['c', 'i']);

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.keyPresses = new Set();
    this.clickTarget = null;
    this.mouseScreen = null;
    this.gameActive = false;

    const onKeyDown = (e) => {
      const key = e.key.toLowerCase();
      this.keys.add(key);
      if (!e.repeat) this.keyPresses.add(key);
      if (this.gameActive && GAME_SHORTCUT_KEYS.has(key)) {
        e.preventDefault();
      }
    };

    const onKeyUp = (e) => {
      this.keys.delete(e.key.toLowerCase());
    };

    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('keyup', onKeyUp, true);

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    canvas.addEventListener('mousedown', (e) => {
      if (this.gameActive) this.canvas.focus();
      if (e.button !== 0) return;
      const rect = canvas.getBoundingClientRect();
      this.clickTarget = {
        screenX: e.clientX - rect.left,
        screenY: e.clientY - rect.top,
      };
    });

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseScreen = {
        screenX: e.clientX - rect.left,
        screenY: e.clientY - rect.top,
      };
    });

    canvas.addEventListener('mouseleave', () => {
      this.mouseScreen = null;
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.zoomDelta = (this.zoomDelta ?? 0) + (e.deltaY > 0 ? -1 : 1);
    }, { passive: false });
  }

  setGameActive(active) {
    this.gameActive = active;
  }

  consumeZoomDelta() {
    const delta = this.zoomDelta ?? 0;
    this.zoomDelta = 0;
    return delta;
  }

  consumeClick() {
    const target = this.clickTarget;
    this.clickTarget = null;
    return target;
  }

  getMouseScreen() {
    return this.mouseScreen;
  }

  getDirection() {
    return directionFromKeys({
      up: this.keys.has('w') || this.keys.has('arrowup'),
      down: this.keys.has('s') || this.keys.has('arrowdown'),
      left: this.keys.has('a') || this.keys.has('arrowleft'),
      right: this.keys.has('d') || this.keys.has('arrowright'),
    });
  }

  isKeyboardActive() {
    return this.getDirection() !== null;
  }

  consumeKeyPress(key) {
    const lower = key.toLowerCase();
    if (this.keyPresses.has(lower)) {
      this.keyPresses.delete(lower);
      return true;
    }
    return false;
  }
}
