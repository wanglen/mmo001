export class Input {
  constructor() {
    this.keys = new Set();
    this.lastDirection = null;

    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
  }

  getDirection() {
    if (this.keys.has('w') || this.keys.has('arrowup')) return 'up';
    if (this.keys.has('s') || this.keys.has('arrowdown')) return 'down';
    if (this.keys.has('a') || this.keys.has('arrowleft')) return 'left';
    if (this.keys.has('d') || this.keys.has('arrowright')) return 'right';
    return null;
  }

  consumeDirection() {
    const direction = this.getDirection();
    if (direction !== this.lastDirection) {
      this.lastDirection = direction;
      return direction;
    }
    return direction;
  }
}
