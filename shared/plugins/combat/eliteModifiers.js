import { DAMAGE_TYPE, createEmptyResistances } from './damageTypes.js';
import { STATUS } from './statusEffects.js';

export const ELITE_SPAWN_CHANCE = 0.12;

/** @type {Record<string, object>} */
export const ELITE_MODIFIERS = {
  extra_fast: {
    id: 'extra_fast',
    label: 'Extra Fast',
    speedMult: 1.5,
    xpMult: 1.5,
    damageType: DAMAGE_TYPE.PHYSICAL,
  },
  fire_enchanted: {
    id: 'fire_enchanted',
    label: 'Fire Enchanted',
    damageMult: 1.1,
    xpMult: 1.75,
    damageType: DAMAGE_TYPE.FIRE,
    onHitStatus: STATUS.POISON,
    resistances: { [DAMAGE_TYPE.FIRE]: 30 },
  },
  champion: {
    id: 'champion',
    label: 'Champion',
    hpMult: 1.5,
    damageMult: 1.25,
    xpMult: 2,
    speedMult: 1.15,
    damageType: DAMAGE_TYPE.PHYSICAL,
    onHitStatus: STATUS.BLEED,
  },
};

const ELITE_MODIFIER_IDS = Object.keys(ELITE_MODIFIERS);

/**
 * @param {() => number} [random]
 * @returns {string | null}
 */
export function rollEliteModifier(random = Math.random) {
  if (random() > ELITE_SPAWN_CHANCE) return null;
  const index = Math.floor(random() * ELITE_MODIFIER_IDS.length);
  return ELITE_MODIFIER_IDS[index];
}

/**
 * @param {object} monster
 * @param {string} modifierId
 */
export function applyEliteModifier(monster, modifierId) {
  const mod = ELITE_MODIFIERS[modifierId];
  if (!mod || monster.isBoss) return monster;

  monster.isElite = true;
  monster.eliteModifier = modifierId;
  monster.label = `${mod.label} ${monster.label}`;

  if (mod.hpMult) {
    monster.maxHp = Math.floor(monster.maxHp * mod.hpMult);
    monster.hp = monster.maxHp;
  }
  if (mod.damageMult) monster.damage = Math.floor(monster.damage * mod.damageMult);
  if (mod.speedMult) monster.speed *= mod.speedMult;
  if (mod.xpMult) monster.xpReward = Math.floor(monster.xpReward * mod.xpMult);
  if (mod.damageType) monster.damageType = mod.damageType;
  if (mod.onHitStatus) monster.onHitStatus = mod.onHitStatus;

  monster.resistances = { ...createEmptyResistances(), ...(mod.resistances ?? {}) };
  return monster;
}
