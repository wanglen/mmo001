import { townRecallProgress, TOWN_RECALL_CAST_MS } from '/shared/townHub.js';

export class TownRecallRenderer {
  draw(ctx, player, camera, rafTimestamp = 0) {
    if (!player?.townRecallCasting) return;

    const zoom = camera.zoom ?? 1;
    const screen = camera.worldToScreen(player.x, player.y);
    const progress = townRecallProgress(player.townRecallCastMs ?? 0, TOWN_RECALL_CAST_MS);
    const baseRadius = 22 * zoom;
    const pulse = 1 + Math.sin(rafTimestamp / 120) * 0.08;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    const gradient = ctx.createRadialGradient(screen.x, screen.y, 0, screen.x, screen.y, baseRadius * pulse * 1.6);
    gradient.addColorStop(0, 'rgba(160, 220, 255, 0.35)');
    gradient.addColorStop(0.55, 'rgba(80, 160, 255, 0.18)');
    gradient.addColorStop(1, 'rgba(40, 90, 200, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, baseRadius * pulse * 1.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(180, 220, 255, 0.85)';
    ctx.lineWidth = 3 * zoom;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, baseRadius * pulse, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(120, 170, 230, 0.35)';
    ctx.lineWidth = 2 * zoom;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, baseRadius * pulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#e8f4ff';
    ctx.font = `600 ${Math.max(10, 11 * zoom)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Recalling…', screen.x, screen.y - baseRadius * pulse - 14 * zoom);

    ctx.restore();
  }
}
