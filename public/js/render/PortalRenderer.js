import { filterRevealedPositions, isPositionRevealed } from '/shared/fog.js';

export class PortalRenderer {
  draw(ctx, portals = [], camera, revealed = null) {
    if (!portals.length) return;

    const visible = revealed
      ? filterRevealedPositions(revealed, portals, 32)
      : portals;

    for (const portal of visible) {
      this.drawPortal(ctx, portal, camera);
    }
  }

  drawPortal(ctx, portal, camera) {
    const zoom = camera.zoom ?? 1;
    const screen = camera.worldToScreen(portal.x, portal.y);
    const radius = 14 * zoom;

    const gradient = ctx.createRadialGradient(screen.x, screen.y, 0, screen.x, screen.y, radius);
    gradient.addColorStop(0, 'rgba(120, 200, 255, 0.95)');
    gradient.addColorStop(0.55, 'rgba(60, 140, 255, 0.55)');
    gradient.addColorStop(1, 'rgba(30, 80, 180, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(180, 220, 255, 0.9)';
    ctx.lineWidth = 2 * zoom;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, radius * 0.72, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    const label = portal.label ?? 'Portal';
    ctx.font = `${Math.max(10, 11 * zoom)}px system-ui, sans-serif`;
    const textWidth = ctx.measureText(label).width;
    const padX = 6 * zoom;
    const padY = 3 * zoom;
    const boxY = screen.y - radius - 18 * zoom;
    ctx.fillRect(screen.x - textWidth / 2 - padX, boxY - 12 * zoom, textWidth + padX * 2, 14 * zoom + padY);

    ctx.fillStyle = '#e8f4ff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, screen.x, boxY - 5 * zoom);
  }
}
