/** Pixel-style 16×16 SVG shapes per template key and slot fallback. */

const ICON_SHAPES = {
  rusty_sword: `
    <rect x="7" y="1" width="2" height="7" />
    <rect x="5" y="7" width="6" height="1" />
    <rect x="7" y="8" width="2" height="4" />
    <rect x="6" y="12" width="4" height="2" rx="0.5" />
  `,
  wooden_staff: `
    <rect x="7" y="2" width="2" height="11" />
    <rect x="6" y="1" width="4" height="2" rx="0.5" />
    <circle cx="8" cy="13" r="2" opacity="0.55" />
  `,
  short_bow: `
    <path d="M4 12 Q8 8 4 4" fill="none" stroke="currentColor" stroke-width="1.5" />
    <rect x="3" y="7" width="2" height="2" />
    <path d="M11 4 L13 8 L11 12" fill="none" stroke="currentColor" stroke-width="1" />
  `,
  leather_cap: `
    <path d="M4 8V6a4 4 0 0 1 8 0v2H4z" />
    <rect x="5" y="9" width="6" height="3" rx="0.5" />
    <rect x="6" y="10" width="4" height="1" opacity="0.35" />
  `,
  leather_vest: `
    <rect x="4" y="4" width="8" height="9" rx="1" />
    <rect x="3" y="5" width="2" height="3" rx="0.5" />
    <rect x="11" y="5" width="2" height="3" rx="0.5" />
    <rect x="7" y="7" width="2" height="4" opacity="0.45" />
  `,
  leather_gloves: `
    <rect x="5" y="3" width="6" height="5" rx="1" />
    <rect x="4" y="8" width="2" height="4" rx="0.5" />
    <rect x="7" y="8" width="2" height="5" rx="0.5" />
    <rect x="10" y="8" width="2" height="4" rx="0.5" />
  `,
  leather_boots: `
    <rect x="5" y="3" width="5" height="7" rx="1" />
    <rect x="4" y="10" width="8" height="3" rx="1" />
    <rect x="6" y="5" width="3" height="2" opacity="0.4" />
  `,
  copper_ring: `
    <circle cx="8" cy="9" r="4" fill="none" stroke="currentColor" stroke-width="1.5" />
    <rect x="7" y="3" width="2" height="2" />
    <rect x="6" y="2" width="4" height="1" opacity="0.6" />
  `,
  jade_amulet: `
    <rect x="7" y="1" width="2" height="2" />
    <rect x="6" y="3" width="4" height="1" />
    <path d="M8 4v2" stroke="currentColor" stroke-width="1" fill="none" />
    <path d="M8 6l-3 4h6L8 6z" />
    <rect x="7" y="8" width="2" height="2" opacity="0.4" />
  `,
  health_potion: `
    <rect x="6" y="2" width="4" height="2" rx="0.5" fill="#bdc3c7" />
    <rect x="7" y="1" width="2" height="1" fill="#95a5a6" />
    <path d="M5 4h6l-1 10H6L5 4z" fill="#c0392b" />
    <rect x="6" y="7" width="4" height="4" rx="1" fill="#e74c3c" />
  `,
  mana_potion: `
    <rect x="6" y="2" width="4" height="2" rx="0.5" fill="#bdc3c7" />
    <rect x="7" y="1" width="2" height="1" fill="#95a5a6" />
    <path d="M5 4h6l-1 10H6L5 4z" fill="#5dade2" />
    <rect x="6" y="8" width="4" height="3" rx="0.5" fill="#87ceeb" />
  `,
  ruby: `
    <path d="M8 2 L12 6 L8 14 L4 6 Z" />
    <path d="M4 6 H12" opacity="0.35" />
    <path d="M8 2 V14" opacity="0.25" />
  `,
  sapphire: `
    <path d="M8 2 L11 5 L8 14 L5 5 Z" />
    <path d="M5 5 H11" opacity="0.35" />
    <rect x="7" y="6" width="2" height="5" opacity="0.25" />
  `,
  emerald: `
    <path d="M6 3 L10 3 L12 7 L8 14 L4 7 Z" />
    <path d="M6 3 L8 14 M10 3 L8 14" opacity="0.3" />
  `,
  diamond: `
    <path d="M8 1 L13 6 L8 15 L3 6 Z" />
    <path d="M3 6 H13" opacity="0.4" />
    <path d="M8 1 L5 6 L8 15 L11 6 Z" opacity="0.25" />
  `,
  rune: `
    <rect x="4" y="3" width="8" height="10" rx="1" fill="none" stroke="currentColor" stroke-width="1.2" />
    <path d="M6 6 H10 M8 6 V11 M6 9 H10" fill="none" stroke="currentColor" stroke-width="1.2" />
    <circle cx="8" cy="5" r="0.8" />
  `,
  weapon: `
    <rect x="7" y="1" width="2" height="6" />
    <rect x="5" y="7" width="6" height="1" />
    <rect x="7" y="8" width="2" height="5" />
    <rect x="6" y="13" width="4" height="2" rx="0.5" />
  `,
  helm: `
    <path d="M4 8V6a4 4 0 0 1 8 0v2H4z" />
    <rect x="5" y="9" width="6" height="3" rx="0.5" />
  `,
  chest: `
    <rect x="4" y="4" width="8" height="9" rx="1" />
    <rect x="7" y="7" width="2" height="4" opacity="0.45" />
  `,
  gloves: `
    <rect x="5" y="3" width="6" height="5" rx="1" />
    <rect x="4" y="8" width="2" height="4" rx="0.5" />
    <rect x="10" y="8" width="2" height="4" rx="0.5" />
  `,
  boots: `
    <rect x="5" y="3" width="5" height="7" rx="1" />
    <rect x="4" y="10" width="8" height="3" rx="1" />
  `,
  ring: `
    <circle cx="8" cy="9" r="4" fill="none" stroke="currentColor" stroke-width="1.5" />
  `,
  amulet: `
    <rect x="7" y="1" width="2" height="2" />
    <path d="M8 6l-3 4h6L8 6z" />
  `,
};

const DEFAULT_ICON = 'chest';

const POTION_ICON_KEYS = new Set(['health_potion', 'mana_potion']);
const STROKE_ICON_KEYS = new Set(['rune', 'short_bow', 'copper_ring', 'ring']);

/**
 * Build inline SVG markup for an item icon key.
 * @param {string} type
 */
export function buildItemIconSvg(type) {
  const key = ICON_SHAPES[type] ? type : DEFAULT_ICON;
  const shapes = ICON_SHAPES[key];
  const fillAttr =
    POTION_ICON_KEYS.has(key) || STROKE_ICON_KEYS.has(key) ? '' : ' fill="currentColor"';

  return `<svg class="item-icon-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g${fillAttr}>${shapes}</g></svg>`;
}
