import {
  DEFAULT_UI_THEME,
  getUiThemeColors,
  isUiThemeId,
} from '/shared/uiThemeSettings.js';

const BAR_HEIGHT = 4;
const BAR_BORDER = 1;

/** Screen-space offsets from entity center for HP bar and nameplate (avoids overlap). */
export function getEntityOverheadOffsets(half, zoom) {
  const barYOffset = -half - 4 * zoom;
  const nameplateCenterOffset = barYOffset - BAR_HEIGHT - BAR_BORDER * 2 - 8 * zoom;
  return { barYOffset, nameplateCenterOffset };
}

function themeColors() {
  const raw =
    typeof document !== 'undefined' ? document.documentElement.getAttribute('data-ui-theme') : null;
  return getUiThemeColors(isUiThemeId(raw) ? raw : DEFAULT_UI_THEME);
}

export function drawHpBar(ctx, screenX, screenY, hp, maxHp, width = 24, yOffset = -14) {
  const colors = themeColors();
  const height = BAR_HEIGHT;
  const x = screenX - width / 2;
  const y = screenY + yOffset;

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(x - 1, y - 1, width + 2, height + 2);

  ctx.fillStyle = colors.xpTrack;
  ctx.fillRect(x, y, width, height);

  const ratio = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0;
  ctx.fillStyle =
    ratio > 0.5 ? '#2ecc71' : ratio > 0.25 ? colors.accent : colors.lifeTop;
  ctx.fillRect(x, y, width * ratio, height);
}
