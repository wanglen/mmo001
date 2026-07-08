import { computeHudLayout } from '/shared/hudLayout.js';

/** @param {ReturnType<typeof computeHudLayout>} layout */
export function applyHudLayoutCss(layout) {
  const root = document.documentElement;
  root.style.setProperty('--hud-skill-bar-bottom', `${layout.skillBarBottom}px`);
  root.style.setProperty('--hud-chat-bottom', `${layout.chatBottom}px`);
  root.style.setProperty('--hud-chat-left', `${layout.chatLeft}px`);
  root.style.setProperty('--hud-chat-width', `${layout.chatWidth}px`);
  root.style.setProperty('--hud-chat-log-height', `${layout.chatLogHeight}px`);
}

/** @returns {ReturnType<typeof computeHudLayout>} */
export function updateHudLayout(viewportWidth, viewportHeight) {
  const layout = computeHudLayout(viewportWidth, viewportHeight);
  applyHudLayoutCss(layout);
  return layout;
}
