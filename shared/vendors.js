import { NPC_INTERACT_RANGE } from './npcs.js';
import vendorsData from './content/vendors.json' with { type: 'json' };

export const VENDOR_ID = {
  TOWN_MERCHANT: 'merchant-brok',
};

/** Vendor catalog keyed by vendor id. */
export const VENDORS = vendorsData.vendors;

export function getVendor(vendorId) {
  return VENDORS[vendorId] ?? null;
}

export function isVendorNpc(npc) {
  return npc?.role === 'vendor' || !!npc?.vendorId;
}

export function getVendorIdForNpc(npc) {
  return npc?.vendorId ?? (npc?.role === 'vendor' ? npc.id : null);
}

export function isNearVendor(px, py, npc, range = NPC_INTERACT_RANGE) {
  if (!isVendorNpc(npc)) return false;
  return Math.hypot(npc.x - px, npc.y - py) <= range;
}
