import { directionFromKeys } from '/shared/movement.js';

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.keyPresses = new Set();
    this.clickTarget = null;
    this.mouseScreen = null;

    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      this.keys.add(key);
      if (!e.repeat) this.keyPresses.add(key);
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    canvas.addEventListener('mousedown', (e) => {
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
