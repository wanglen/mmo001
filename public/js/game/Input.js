export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.clickTarget = null;

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
  }

  consumeClick() {
    const target = this.clickTarget;
    this.clickTarget = null;
    return target;
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
