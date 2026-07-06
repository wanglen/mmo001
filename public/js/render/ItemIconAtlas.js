import { resolveItemIconKey } from '/shared/itemIcons.js';

const ICON_SIZE = 16;

function drawRustySword(ctx, ox, oy, c) {
  ctx.fillStyle = c;
  ctx.fillRect(ox + 7, oy + 1, 2, 7);
  ctx.fillRect(ox + 5, oy + 7, 6, 1);
  ctx.fillRect(ox + 7, oy + 8, 2, 4);
  ctx.fillRect(ox + 6, oy + 12, 4, 2);
}

function drawWoodenStaff(ctx, ox, oy, c) {
  ctx.fillStyle = c;
  ctx.fillRect(ox + 7, oy + 2, 2, 11);
  ctx.fillRect(ox + 6, oy + 1, 4, 2);
  ctx.fillStyle = '#85c1e9';
  ctx.fillRect(ox + 7, oy + 12, 2, 2);
}

function drawShortBow(ctx, ox, oy, c) {
  ctx.fillStyle = c;
  ctx.fillRect(ox + 3, oy + 4, 1, 8);
  ctx.fillRect(ox + 4, oy + 4, 1, 1);
  ctx.fillRect(ox + 4, oy + 11, 1, 1);
  ctx.fillRect(ox + 5, oy + 5, 1, 1);
  ctx.fillRect(ox + 5, oy + 10, 1, 1);
  ctx.fillRect(ox + 6, oy + 6, 1, 1);
  ctx.fillRect(ox + 6, oy + 9, 1, 1);
  ctx.fillRect(ox + 7, oy + 7, 1, 2);
  ctx.fillRect(ox + 11, oy + 4, 1, 1);
  ctx.fillRect(ox + 12, oy + 5, 1, 2);
  ctx.fillRect(ox + 13, oy + 6, 1, 4);
  ctx.fillRect(ox + 12, oy + 10, 1, 2);
  ctx.fillRect(ox + 11, oy + 11, 1, 1);
}

function drawLeatherCap(ctx, ox, oy, c) {
  ctx.fillStyle = c;
  ctx.fillRect(ox + 4, oy + 6, 8, 2);
  ctx.fillRect(ox + 5, oy + 4, 6, 2);
  ctx.fillRect(ox + 5, oy + 8, 6, 3);
  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(ox + 6, oy + 9, 4, 1);
}

function drawLeatherVest(ctx, ox, oy, c) {
  ctx.fillStyle = c;
  ctx.fillRect(ox + 4, oy + 4, 8, 9);
  ctx.fillRect(ox + 3, oy + 5, 2, 3);
  ctx.fillRect(ox + 11, oy + 5, 2, 3);
  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(ox + 7, oy + 7, 2, 4);
}

function drawLeatherGloves(ctx, ox, oy, c) {
  ctx.fillStyle = c;
  ctx.fillRect(ox + 5, oy + 3, 6, 5);
  ctx.fillRect(ox + 4, oy + 8, 2, 4);
  ctx.fillRect(ox + 7, oy + 8, 2, 5);
  ctx.fillRect(ox + 10, oy + 8, 2, 4);
}

function drawLeatherBoots(ctx, ox, oy, c) {
  ctx.fillStyle = c;
  ctx.fillRect(ox + 5, oy + 3, 5, 7);
  ctx.fillRect(ox + 4, oy + 10, 8, 3);
  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(ox + 6, oy + 5, 3, 2);
}

function drawCopperRing(ctx, ox, oy, c) {
  ctx.fillStyle = c;
  ctx.fillRect(ox + 4, oy + 5, 1, 6);
  ctx.fillRect(ox + 11, oy + 5, 1, 6);
  ctx.fillRect(ox + 5, oy + 4, 6, 1);
  ctx.fillRect(ox + 5, oy + 11, 6, 1);
  ctx.fillRect(ox + 7, oy + 3, 2, 2);
  ctx.fillRect(ox + 6, oy + 2, 4, 1);
}

function drawJadeAmulet(ctx, ox, oy, c) {
  ctx.fillStyle = c;
  ctx.fillRect(ox + 7, oy + 1, 2, 2);
  ctx.fillRect(ox + 6, oy + 3, 4, 1);
  ctx.fillRect(ox + 7, oy + 4, 2, 2);
  ctx.fillRect(ox + 5, oy + 6, 6, 4);
  ctx.fillRect(ox + 7, oy + 8, 2, 2);
}

function drawHealthPotion(ctx, ox, oy) {
  ctx.fillStyle = '#bdc3c7';
  ctx.fillRect(ox + 6, oy + 2, 4, 2);
  ctx.fillRect(ox + 7, oy + 1, 2, 1);
  ctx.fillStyle = '#922b21';
  ctx.fillRect(ox + 5, oy + 4, 6, 1);
  ctx.fillRect(ox + 6, oy + 5, 4, 9);
  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(ox + 6, oy + 7, 4, 4);
}

function drawManaPotion(ctx, ox, oy) {
  ctx.fillStyle = '#bdc3c7';
  ctx.fillRect(ox + 6, oy + 2, 4, 2);
  ctx.fillRect(ox + 7, oy + 1, 2, 1);
  ctx.fillStyle = '#5dade2';
  ctx.fillRect(ox + 5, oy + 4, 6, 1);
  ctx.fillRect(ox + 6, oy + 5, 4, 9);
  ctx.fillStyle = '#87ceeb';
  ctx.fillRect(ox + 6, oy + 8, 4, 3);
}

const DRAWERS = {
  rusty_sword: drawRustySword,
  wooden_staff: drawWoodenStaff,
  short_bow: drawShortBow,
  leather_cap: drawLeatherCap,
  leather_vest: drawLeatherVest,
  leather_gloves: drawLeatherGloves,
  leather_boots: drawLeatherBoots,
  copper_ring: drawCopperRing,
  jade_amulet: drawJadeAmulet,
  health_potion: (ctx, ox, oy) => drawHealthPotion(ctx, ox, oy),
  mana_potion: (ctx, ox, oy) => drawManaPotion(ctx, ox, oy),
  weapon: drawRustySword,
  helm: drawLeatherCap,
  chest: drawLeatherVest,
  gloves: drawLeatherGloves,
  boots: drawLeatherBoots,
  ring: drawCopperRing,
  amulet: drawJadeAmulet,
};

/** Cached 16×16 item icons for ground loot rendering. */
export class ItemIconAtlas {
  constructor() {
    this.cache = new Map();
  }

  get(key) {
    if (this.cache.has(key)) return this.cache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = ICON_SIZE;
    canvas.height = ICON_SIZE;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const drawer = DRAWERS[key] ?? DRAWERS.chest ?? drawLeatherVest;
    if (key === 'health_potion' || key === 'mana_potion') {
      drawer(ctx, 0, 0);
    } else {
      drawer(ctx, 0, 0, '#ecf0f1');
    }

    this.cache.set(key, canvas);
    return canvas;
  }

  getForItem(item, fallbackSlot = '') {
    return this.get(resolveItemIconKey(item, fallbackSlot));
  }
}
