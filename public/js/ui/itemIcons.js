/** Pixel-style 16×16 icons per equipment slot / item type. */

const ICON_SHAPES = {
  weapon: `
    <rect x="7" y="1" width="2" height="6" />
    <rect x="5" y="7" width="6" height="1" />
    <rect x="7" y="8" width="2" height="5" />
    <rect x="6" y="13" width="4" height="2" rx="0.5" />
  `,
  helm: `
    <path d="M4 8V6a4 4 0 0 1 8 0v2H4z" />
    <rect x="5" y="9" width="6" height="3" rx="0.5" />
    <rect x="6" y="10" width="4" height="1" opacity="0.35" />
  `,
  chest: `
    <rect x="4" y="4" width="8" height="9" rx="1" />
    <rect x="3" y="5" width="2" height="3" rx="0.5" />
    <rect x="11" y="5" width="2" height="3" rx="0.5" />
    <rect x="7" y="7" width="2" height="4" opacity="0.45" />
  `,
  gloves: `
    <rect x="5" y="3" width="6" height="5" rx="1" />
    <rect x="4" y="8" width="2" height="4" rx="0.5" />
    <rect x="7" y="8" width="2" height="5" rx="0.5" />
    <rect x="10" y="8" width="2" height="4" rx="0.5" />
  `,
  boots: `
    <rect x="5" y="3" width="5" height="7" rx="1" />
    <rect x="4" y="10" width="8" height="3" rx="1" />
    <rect x="6" y="5" width="3" height="2" opacity="0.4" />
  `,
  ring: `
    <circle cx="8" cy="9" r="4" fill="none" stroke="currentColor" stroke-width="1.5" />
    <rect x="7" y="3" width="2" height="2" />
    <rect x="6" y="2" width="4" height="1" opacity="0.6" />
  `,
  amulet: `
    <rect x="7" y="1" width="2" height="2" />
    <rect x="6" y="3" width="4" height="1" />
    <path d="M8 4v2" stroke="currentColor" stroke-width="1" fill="none" />
    <path d="M8 6l-3 4h6L8 6z" />
    <rect x="7" y="8" width="2" height="2" opacity="0.4" />
  `,
};

const DEFAULT_ICON = 'chest';

/**
 * Resolve which icon to show for an item or empty equipment slot.
 * @param {object|null} item
 * @param {string} [fallbackSlot]
 */
export function resolveIconType(item, fallbackSlot = '') {
  return item?.slot ?? item?.type ?? (fallbackSlot || DEFAULT_ICON);
}

/**
 * Build inline SVG markup for an equipment / item type icon.
 * @param {string} type - weapon, helm, chest, gloves, boots, ring, amulet
 */
export function buildItemIconSvg(type) {
  const key = ICON_SHAPES[type] ? type : DEFAULT_ICON;
  const shapes = ICON_SHAPES[key];

  return `<svg class="item-icon-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g fill="currentColor">${shapes}</g></svg>`;
}

/**
 * HTML for a slot cell: type icon tinted by rarity (or muted when empty).
 * @param {object|null} item
 * @param {string} [slotType] - equipment slot name when cell is empty
 */
export function buildSlotIconHtml(item, slotType = '') {
  const type = resolveIconType(item, slotType);
  const icon = buildItemIconSvg(type);
  const empty = !item;

  return `<span class="slot-visual${empty ? ' slot-visual--empty' : ''}">${icon}</span>`;
}
