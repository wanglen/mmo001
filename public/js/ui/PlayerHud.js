import { xpToNextLevel } from '/shared/stats.js';
import { isTownHubMap, TOWN_RECALL_CAST_MS, townRecallProgress } from '/shared/townHub.js';

const ORB_RADIUS = 34;
const ORB_MARGIN = 18;
/** Distance from canvas bottom to orb center (clears center skill bar). */
const ORB_BOTTOM = 56;
const XP_BAR_HEIGHT = 5;
const XP_BAR_GAP = 10;

export class PlayerHud {
  draw(ctx, player, zone = null, map = null, canvasWidth = 0, canvasHeight = 0, version = null) {
    if (!player) return;

    const width = canvasWidth || ctx.canvas.width;
    const height = canvasHeight || ctx.canvas.height;

    if (zone) {
      this.drawZoneBadge(ctx, zone, width);
    }

    this.drawRecallUi(ctx, player, map, width, height);

    const orbY = height - ORB_BOTTOM;
    const lifeX = ORB_MARGIN + ORB_RADIUS;
    const manaX = width - ORB_MARGIN - ORB_RADIUS;

    this.drawResourceOrb(ctx, lifeX, orbY, ORB_RADIUS, player.hp, player.maxHp, {
      fillTop: '#e74c3c',
      fillBottom: '#7b1010',
      ring: '#3d1515',
      label: 'Life',
    });

    this.drawResourceOrb(ctx, manaX, orbY, ORB_RADIUS, player.mp, player.maxMp, {
      fillTop: '#3498db',
      fillBottom: '#1a4a7a',
      ring: '#152a45',
      label: 'Mana',
    });

    this.drawLevelBadge(ctx, lifeX, orbY, ORB_RADIUS, player.level ?? 1);
    this.drawXpBar(ctx, lifeX, manaX, orbY, ORB_RADIUS, player);
    this.drawStatPointsHint(ctx, lifeX, orbY, ORB_RADIUS, player.statPoints ?? 0);

    this.drawVersionLabel(ctx, version, width, height);
  }

  drawResourceOrb(ctx, cx, cy, radius, current, max, { fillTop, fillBottom, ring, label }) {
    const ratio = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;

    ctx.save();

    // Stone pedestal shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + radius * 0.72, radius * 0.85, radius * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Outer ring
    ctx.strokeStyle = '#2a2218';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 3, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = ring;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Empty globe interior
    ctx.fillStyle = '#0a0c12';
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 2, 0, Math.PI * 2);
    ctx.fill();

    // Liquid fill ( rises from bottom )
    if (ratio > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 3, 0, Math.PI * 2);
      ctx.clip();

      const fillHeight = (radius * 2 - 6) * ratio;
      const fillY = cy + radius - 3 - fillHeight;
      const grad = ctx.createLinearGradient(cx, fillY, cx, cy + radius);
      grad.addColorStop(0, fillTop);
      grad.addColorStop(1, fillBottom);
      ctx.fillStyle = grad;
      ctx.fillRect(cx - radius, fillY, radius * 2, fillHeight + 2);

      // Surface shimmer
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fillRect(cx - radius, fillY, radius * 2, 3);
      ctx.restore();
    }

    // Glass highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx - radius * 0.22, cy - radius * 0.28, radius * 0.55, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();

    ctx.restore();

    // Numeric value
    ctx.fillStyle = '#f8f4ec';
    ctx.font = '600 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.floor(current)}`, cx, cy - 2);
    ctx.font = '9px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(220, 220, 220, 0.75)';
    ctx.fillText(`/${max}`, cx, cy + 10);

    // Label under orb
    ctx.fillStyle = 'rgba(200, 190, 170, 0.85)';
    ctx.font = '700 9px system-ui, sans-serif';
    ctx.fillText(label.toUpperCase(), cx, cy + radius + 12);
  }

  drawLevelBadge(ctx, lifeX, orbY, radius, level) {
    const bx = lifeX - radius - 6;
    const by = orbY + radius * 0.35;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
    ctx.strokeStyle = '#8b7355';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(bx, by, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f1c40f';
    ctx.font = '700 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(level), bx, by + 1);
  }

  drawXpBar(ctx, lifeX, manaX, orbY, radius, player) {
    const barY = orbY + radius + XP_BAR_GAP + 8;
    const barX = lifeX - radius;
    const barWidth = manaX + radius - barX;
    const xpNeeded = xpToNextLevel(player.level);
    const ratio = xpNeeded > 0 ? Math.max(0, Math.min(1, player.xp / xpNeeded)) : 0;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(barX - 2, barY - 2, barWidth + 4, XP_BAR_HEIGHT + 4);

    ctx.fillStyle = '#1a1408';
    ctx.fillRect(barX, barY, barWidth, XP_BAR_HEIGHT);

    if (ratio > 0) {
      const grad = ctx.createLinearGradient(barX, barY, barX + barWidth * ratio, barY);
      grad.addColorStop(0, '#8b6914');
      grad.addColorStop(1, '#f1c40f');
      ctx.fillStyle = grad;
      ctx.fillRect(barX, barY, barWidth * ratio, XP_BAR_HEIGHT);
    }

    ctx.fillStyle = 'rgba(230, 220, 200, 0.9)';
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(
      `XP ${Math.floor(player.xp)} / ${xpNeeded}  ·  Gold ${player.gold ?? 0}`,
      barX + barWidth / 2,
      barY - 3
    );
  }

  drawStatPointsHint(ctx, lifeX, orbY, radius, statPoints) {
    if (statPoints <= 0) return;

    const x = lifeX + radius + 4;
    const y = orbY - radius + 8;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 1;
    const text = `+${statPoints} (C)`;
    ctx.font = '600 10px system-ui, sans-serif';
    const tw = ctx.measureText(text).width;
    ctx.fillRect(x, y - 10, tw + 10, 16);
    ctx.strokeRect(x + 0.5, y - 9.5, tw + 9, 15);
    ctx.fillStyle = '#f1c40f';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + 5, y - 2);
  }

  drawZoneBadge(ctx, zone, canvasWidth) {
    const label = zone.label ?? 'Wilderness';
    const color = zone.color ?? '#a8d5a2';
    const width = 132;
    const height = 28;
    const x = canvasWidth - width - 16;
    const y = 16;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
    ctx.fillStyle = color;
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + width / 2, y + height / 2);
  }

  drawRecallUi(ctx, player, map, canvasWidth, canvasHeight) {
    const width = canvasWidth || ctx.canvas.width;
    const height = canvasHeight || ctx.canvas.height;

    if (player.townRecallCasting) {
      const progress = townRecallProgress(player.townRecallCastMs ?? 0, TOWN_RECALL_CAST_MS);
      const cx = width / 2;
      const cy = height - 120;
      const radius = 28;

      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#5dade2';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
      ctx.stroke();

      ctx.fillStyle = '#e8f4ff';
      ctx.font = '600 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Recalling to town…', cx, cy);
      return;
    }

    if (isTownHubMap(map)) return;

    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    const hint = 'Press T — recall to town (6s cast)';
    ctx.font = '12px system-ui, sans-serif';
    const textWidth = ctx.measureText(hint).width;
    const boxW = textWidth + 20;
    const boxX = width / 2 - boxW / 2;
    const boxY = height - 100;
    ctx.fillRect(boxX, boxY, boxW, 24);
    ctx.fillStyle = '#c8dce8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(hint, width / 2, boxY + 12);
  }

  drawVersionLabel(ctx, version, canvasWidth, canvasHeight) {
    if (!version) return;

    const height = canvasHeight || ctx.canvas.height;
    const label = `v${version}`;

    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = 'rgba(200, 208, 220, 0.45)';
    ctx.fillText(label, canvasWidth - 14, height - 14);
  }
}
