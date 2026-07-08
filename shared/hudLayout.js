/** Default skill bar block height (slots + padding; matches CSS clamp max). */
export const HUD_SKILL_BAR_HEIGHT = 88;

const XP_GAP_ABOVE_SKILL_BAR = 8;
const XP_TEXT_HEIGHT = 14;
const XP_BAR_HEIGHT = 5;
const RECALL_HINT_HEIGHT = 24;
const RECALL_GAP_ABOVE_XP = 12;

/** Pixels below orb center to the lowest resource label edge. */
export function orbStackHeightBelowCenter(orbRadius, options = {}) {
  const { orbLabelOffset = 12, orbLabelHeight = 9 } = options;
  return orbRadius + orbLabelOffset + orbLabelHeight;
}

/** XP + gold strip sits entirely above the DOM skill bar. */
export function xpBarTopFromBottom(skillBarTopFromBottom) {
  return skillBarTopFromBottom + XP_GAP_ABOVE_SKILL_BAR + XP_TEXT_HEIGHT;
}

/**
 * Compute bottom HUD positions so canvas orbs/XP/recall sit in clear bands above the skill bar.
 * @param {number} viewportWidth
 * @param {number} viewportHeight
 */
export function computeHudLayout(viewportWidth, viewportHeight) {
  const compact = viewportHeight < 640 || viewportWidth < 900;
  const scale = Math.min(1, viewportHeight / 720);

  const skillBarBottom = compact ? 10 : Math.max(12, Math.round(16 * scale));
  const skillBarHeight = Math.round((compact ? 76 : HUD_SKILL_BAR_HEIGHT) * Math.max(0.85, scale));
  const skillBarTopFromBottom = skillBarBottom + skillBarHeight;
  const orbRadius = Math.round((compact ? 30 : 34) * Math.max(0.82, scale));
  const orbMargin = Math.max(10, Math.round(18 * scale));
  const orbLabelOffset = 12;
  const orbCenterFromBottom = skillBarBottom + Math.round(skillBarHeight * 0.5);

  const xpBarTop = xpBarTopFromBottom(skillBarTopFromBottom);
  const xpBlockTopFromBottom = xpBarTop + XP_BAR_HEIGHT + XP_TEXT_HEIGHT;
  const recallHintBottomFromBottom = xpBlockTopFromBottom + RECALL_GAP_ABOVE_XP + RECALL_HINT_HEIGHT;
  const recallCastCenterFromBottom = recallHintBottomFromBottom + 28;

  const orbTopFromBottom = orbCenterFromBottom + orbRadius;
  const resourceLowestFromBottom =
    orbCenterFromBottom + orbStackHeightBelowCenter(orbRadius, { orbLabelOffset: orbLabelOffset });
  const hudBandTop = Math.max(resourceLowestFromBottom, recallHintBottomFromBottom, orbTopFromBottom) + 12;
  const chatBottom = hudBandTop + 10;
  const hudScrimTopFromBottom = hudBandTop + 16;

  const chatWidthLimit = Math.floor(viewportWidth * 0.36) - orbMargin;
  const chatWidth = Math.max(
    140,
    Math.min(compact ? 200 : 240, Math.max(150, Math.floor(viewportWidth * 0.34)), chatWidthLimit)
  );

  const chatLogHeight = compact
    ? Math.min(72, Math.round(viewportHeight * 0.11))
    : Math.min(96, Math.round(viewportHeight * 0.13));

  return {
    skillBarBottom,
    skillBarHeight,
    skillBarTopFromBottom,
    orbRadius,
    orbMargin,
    orbCenterFromBottom,
    orbLabelOffset,
    xpBarTopFromBottom: xpBarTop,
    xpBarHeight: XP_BAR_HEIGHT,
    xpTextHeight: XP_TEXT_HEIGHT,
    recallHintBottomFromBottom,
    recallCastCenterFromBottom,
    hudScrimTopFromBottom,
    chatBottom,
    chatLeft: orbMargin,
    chatWidth,
    chatLogHeight,
    versionOffsetBottom: skillBarBottom,
  };
}
