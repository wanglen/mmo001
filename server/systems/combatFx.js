import { COMBAT_FX_MAX_AGE_MS } from '../../shared/combatFx.js';

/** @type {object[]} */
let events = [];

export function pushDamageFx({ x, y, damage, now = Date.now() }) {
  events.push({ type: 'damage', x, y, value: damage, at: now });
}

export function pushHitFlash({ monsterId, now = Date.now() }) {
  events.push({ type: 'hitFlash', monsterId, at: now });
}

export function collectCombatFx(now = Date.now()) {
  events = events.filter((e) => now - e.at < COMBAT_FX_MAX_AGE_MS);
  return events.map((e) => ({ ...e }));
}

export function resetCombatFx() {
  events = [];
}
