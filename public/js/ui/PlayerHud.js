import { xpToNextLevel } from '/shared/stats.js';

export class PlayerHud {
  draw(ctx, player) {
    if (!player) return;

    const pad = 16;
    const barWidth = 180;
    const barHeight = 14;
    const x = pad;
    const y = pad;

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
    ctx.fillText(`${label} ${Math.ceil(current)}/${max}`, x + width / 2, y + height - 3);
  }
}
