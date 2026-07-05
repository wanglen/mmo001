import { xpToNextLevel } from '/shared/stats.js';
import { getAvailableMp } from '/shared/skills.js';
import { isTownHubMap, TOWN_RECALL_CAST_MS, townRecallProgress } from '/shared/townHub.js';

export class PlayerHud {
  draw(ctx, player, zone = null, map = null, canvasWidth = 0, canvasHeight = 0) {
    if (!player) return;

    const pad = 16;
    const barWidth = 180;
    const barHeight = 14;
    const x = pad;
    const y = pad;

    if (zone) {
      this.drawZoneBadge(ctx, zone, ctx.canvas.width);
    }

    this.drawRecallUi(ctx, player, map, canvasWidth, canvasHeight);

    this.drawBar(ctx, x, y, barWidth, barHeight, player.hp, player.maxHp, '#c0392b', '#541212', 'HP');
    this.drawBar(
      ctx,
      x,
      y + barHeight + 8,
      barWidth,
      barHeight,
      player.mp,
      player.maxMp,
      '#2980b9',
      '#1a334d',
      'MP'
    );

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x, y + (barHeight + 8) * 2 + 4, barWidth, 22);
    ctx.fillStyle = '#fff';
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(
      `Lv ${player.level}  STR ${player.str}  DEX ${player.dex}  INT ${player.int}  VIT ${player.vit}`,
      x + 6,
      y + (barHeight + 8) * 2 + 19
    );

    if ((player.statPoints ?? 0) > 0) {
      ctx.fillStyle = '#f1c40f';
      ctx.fillText(`+${player.statPoints} pts (C)`, x + 6, y + (barHeight + 8) * 2 + 32);
    }

    const xpY = y + (barHeight + 8) * 3 + 8;
    const xpNeeded = xpToNextLevel(player.level);
    this.drawBar(ctx, x, xpY, barWidth, 10, player.xp, xpNeeded, '#f1c40f', '#5a4a0a', 'XP');
  }

  drawBar(ctx, x, y, width, height, current, max, fillColor, bgColor, label) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x - 2, y - 2, width + 4, height + 4);

    ctx.fillStyle = bgColor;
    ctx.fillRect(x, y, width, height);

    const ratio = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, width * ratio, height);

    ctx.fillStyle = '#fff';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${label} ${getAvailableMp({ mp: current })}/${max}`, x + width / 2, y + height - 3);
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
      const cy = height - 72;
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
    const boxY = height - 48;
    ctx.fillRect(boxX, boxY, boxW, 24);
    ctx.fillStyle = '#c8dce8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(hint, width / 2, boxY + 12);
  }
}
