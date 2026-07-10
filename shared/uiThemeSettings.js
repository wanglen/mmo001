/**
 * Client UI theme preferences (anime chrome packs).
 * Persisted in localStorage — same pattern as audioSettings.
 */

/** @typedef {'jrpg' | 'shonen' | 'darkfan' | 'isekai'} UiThemeId */

/** localStorage key for UI theme preference. */
export const UI_THEME_KEY = 'mmo001_ui_theme';

/** @type {UiThemeId} */
export const DEFAULT_UI_THEME = 'darkfan';

/** @type {readonly UiThemeId[]} */
export const UI_THEME_IDS = Object.freeze(['jrpg', 'shonen', 'darkfan', 'isekai']);

/**
 * @typedef {object} UiThemeOption
 * @property {UiThemeId} id
 * @property {string} label
 * @property {string} description
 * @property {string[]} swatches
 */

/** @type {readonly UiThemeOption[]} */
export const UI_THEME_OPTIONS = Object.freeze([
  {
    id: 'jrpg',
    label: 'Soft JRPG',
    description: 'Parchment panels, ink outlines, teal accents',
    swatches: ['#f3e7d1', '#2f6f6a', '#6b5136', '#c9a227'],
  },
  {
    id: 'shonen',
    label: 'Shonen action',
    description: 'Angular frames, gold borders, hot CTAs',
    swatches: ['#0f141c', '#ff4d4d', '#f0c14a', '#3db7ff'],
  },
  {
    id: 'darkfan',
    label: 'Dark fantasy anime',
    description: 'Ink blacks, crimson & gold — default',
    swatches: ['#161014', '#d4af37', '#b91c2c', '#8a6a3d'],
  },
  {
    id: 'isekai',
    label: 'Clean isekai',
    description: 'Glass panels, cyan / soft magenta',
    swatches: ['#1a1f2b', '#22d3ee', '#a78bfa', '#f0abfc'],
  },
]);

/**
 * Canvas / JS palette for HUD drawing (DOM uses CSS variables).
 * @typedef {object} UiThemeCanvasColors
 * @property {string} lifeTop
 * @property {string} lifeBottom
 * @property {string} lifeRing
 * @property {string} manaTop
 * @property {string} manaBottom
 * @property {string} manaRing
 * @property {string} xpFillStart
 * @property {string} xpFillEnd
 * @property {string} xpTrack
 * @property {string} xpBorder
 * @property {string} text
 * @property {string} textMuted
 * @property {string} accent
 * @property {string} panelFill
 * @property {string} panelStroke
 * @property {string} minimapFill
 * @property {string} minimapStroke
 * @property {string} scrim
 * @property {string} fontUi
 */

/** @type {Record<UiThemeId, UiThemeCanvasColors>} */
export const UI_THEME_CANVAS = Object.freeze({
  jrpg: {
    lifeTop: '#b23b3b',
    lifeBottom: '#7a2424',
    lifeRing: '#6b5136',
    manaTop: '#2f6f6a',
    manaBottom: '#1f4d49',
    manaRing: '#6b5136',
    xpFillStart: '#c9a227',
    xpFillEnd: '#e8c84a',
    xpTrack: 'rgba(20, 24, 30, 0.75)',
    xpBorder: '#c4a574',
    text: '#f7f1e4',
    textMuted: '#d8cbb0',
    accent: '#c9a227',
    panelFill: 'rgba(230, 211, 176, 0.88)',
    panelStroke: '#6b5136',
    minimapFill: 'rgba(217, 228, 212, 0.9)',
    minimapStroke: '#6b5136',
    scrim: 'rgba(42, 51, 64, 0.55)',
    fontUi: '"Cormorant Garamond", serif',
  },
  shonen: {
    lifeTop: '#ff3b3b',
    lifeBottom: '#a01010',
    lifeRing: '#f0c14a',
    manaTop: '#3db7ff',
    manaBottom: '#1a5a8a',
    manaRing: '#f0c14a',
    xpFillStart: '#f0c14a',
    xpFillEnd: '#ffe08a',
    xpTrack: '#0b0e14',
    xpBorder: '#f0c14a',
    text: '#f2f5fa',
    textMuted: '#c9d0dc',
    accent: '#f0c14a',
    panelFill: '#1a2230',
    panelStroke: '#f0c14a',
    minimapFill: '#0b0e14',
    minimapStroke: '#3db7ff',
    scrim: 'rgba(10, 12, 18, 0.65)',
    fontUi: '"Exo 2", system-ui, sans-serif',
  },
  darkfan: {
    lifeTop: '#b91c2c',
    lifeBottom: '#5c151c',
    lifeRing: '#d4af37',
    manaTop: '#4a6fa5',
    manaBottom: '#243a5c',
    manaRing: '#d4af37',
    xpFillStart: '#8a6a3d',
    xpFillEnd: '#d4af37',
    xpTrack: '#140f12',
    xpBorder: '#8a6a3d',
    text: '#efe6dc',
    textMuted: '#c4b8a8',
    accent: '#d4af37',
    panelFill: '#161014',
    panelStroke: '#8a6a3d',
    minimapFill: '#120e11',
    minimapStroke: '#8a6a3d',
    scrim: 'rgba(8, 6, 8, 0.7)',
    fontUi: '"Zen Kurenaido", system-ui, sans-serif',
  },
  isekai: {
    lifeTop: '#fb7185',
    lifeBottom: '#be123c',
    lifeRing: 'rgba(255,255,255,0.45)',
    manaTop: '#22d3ee',
    manaBottom: '#0e7490',
    manaRing: 'rgba(255,255,255,0.45)',
    xpFillStart: '#22d3ee',
    xpFillEnd: '#f0abfc',
    xpTrack: 'rgba(0,0,0,0.35)',
    xpBorder: 'rgba(255,255,255,0.25)',
    text: '#f4f7ff',
    textMuted: '#c5cde0',
    accent: '#22d3ee',
    panelFill: 'rgba(26, 31, 43, 0.92)',
    panelStroke: 'rgba(255,255,255,0.35)',
    minimapFill: 'rgba(26, 31, 43, 0.85)',
    minimapStroke: 'rgba(255,255,255,0.35)',
    scrim: 'rgba(16, 20, 32, 0.55)',
    fontUi: '"M PLUS Rounded 1c", system-ui, sans-serif',
  },
});

/**
 * @param {unknown} value
 * @returns {value is UiThemeId}
 */
export function isUiThemeId(value) {
  return typeof value === 'string' && UI_THEME_IDS.includes(/** @type {UiThemeId} */ (value));
}

/**
 * @param {string | null | undefined} raw
 * @returns {UiThemeId}
 */
export function parseUiTheme(raw) {
  if (!raw) return DEFAULT_UI_THEME;
  try {
    const trimmed = String(raw).trim();
    if (isUiThemeId(trimmed)) return trimmed;
    const parsed = JSON.parse(trimmed);
    if (isUiThemeId(parsed)) return parsed;
    if (parsed && isUiThemeId(parsed.theme)) return parsed.theme;
  } catch {
    if (isUiThemeId(raw)) return raw;
  }
  return DEFAULT_UI_THEME;
}

/**
 * @param {UiThemeId} themeId
 * @returns {UiThemeCanvasColors}
 */
export function getUiThemeColors(themeId) {
  const id = isUiThemeId(themeId) ? themeId : DEFAULT_UI_THEME;
  return UI_THEME_CANVAS[id];
}

/**
 * Read theme from localStorage (browser only).
 * @param {Storage | null | undefined} [storage]
 * @returns {UiThemeId}
 */
export function loadUiTheme(storage) {
  if (!storage) return DEFAULT_UI_THEME;
  try {
    return parseUiTheme(storage.getItem(UI_THEME_KEY));
  } catch {
    return DEFAULT_UI_THEME;
  }
}

/**
 * Persist theme id.
 * @param {UiThemeId} themeId
 * @param {Storage | null | undefined} [storage]
 */
export function saveUiTheme(themeId, storage) {
  if (!storage || !isUiThemeId(themeId)) return;
  try {
    storage.setItem(UI_THEME_KEY, themeId);
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * Apply theme to documentElement and persist.
 * @param {UiThemeId} themeId
 * @param {{ documentElement?: Element | null, storage?: Storage | null }} [opts]
 * @returns {UiThemeId}
 */
export function applyUiTheme(themeId, opts = {}) {
  const id = isUiThemeId(themeId) ? themeId : DEFAULT_UI_THEME;
  const el = opts.documentElement ?? (typeof document !== 'undefined' ? document.documentElement : null);
  if (el && 'setAttribute' in el) {
    el.setAttribute('data-ui-theme', id);
  }
  const storage = opts.storage ?? (typeof localStorage !== 'undefined' ? localStorage : null);
  saveUiTheme(id, storage);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mmo:ui-theme', { detail: { theme: id } }));
  }
  return id;
}

/**
 * Load saved theme and apply to the document.
 * @param {{ documentElement?: Element | null, storage?: Storage | null }} [opts]
 * @returns {UiThemeId}
 */
export function initUiTheme(opts = {}) {
  const storage = opts.storage ?? (typeof localStorage !== 'undefined' ? localStorage : null);
  return applyUiTheme(loadUiTheme(storage), opts);
}
