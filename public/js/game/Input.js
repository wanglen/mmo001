export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.clickTarget = null;
    this.mouseScreen = null;

    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
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
    if (this.keys.has('w') || this.keys.has('arrowup')) return 'up';
    if (this.keys.has('s') || this.keys.has('arrowdown')) return 'down';
    if (this.keys.has('a') || this.keys.has('arrowleft')) return 'left';
    if (this.keys.has('d') || this.keys.has('arrowright')) return 'right';
    return null;
  }

  isKeyboardActive() {
    return this.getDirection() !== null;
  }
}
