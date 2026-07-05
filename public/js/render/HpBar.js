const BAR_HEIGHT = 4;
const BAR_BORDER = 1;

/** Screen-space offsets from entity center for HP bar and nameplate (avoids overlap). */
export function getEntityOverheadOffsets(half, zoom) {
  const barYOffset = -half - 4 * zoom;
  const nameplateCenterOffset = barYOffset - BAR_HEIGHT - BAR_BORDER * 2 - 8 * zoom;
  return { barYOffset, nameplateCenterOffset };
}

export function drawHpBar(ctx, screenX, screenY, hp, maxHp, width = 24, yOffset = -14) {
  const height = BAR_HEIGHT;
  const x = screenX - width / 2;
  const y = screenY + yOffset;

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(x - 1, y - 1, width + 2, height + 2);

  ctx.fillStyle = '#3a1010';
  ctx.fillRect(x, y, width, height);

  const ratio = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0;
  ctx.fillStyle = ratio > 0.5 ? '#2ecc71' : ratio > 0.25 ? '#f1c40f' : '#e74c3c';
  ctx.fillRect(x, y, width * ratio, height);
}
