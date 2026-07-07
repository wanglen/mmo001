export const DAMAGE_TYPE = {
  PHYSICAL: 'physical',
  FIRE: 'fire',
  COLD: 'cold',
  LIGHTNING: 'lightning',
  POISON: 'poison',
};

/** @returns {Record<string, number>} */
export function createEmptyResistances() {
  return {
    [DAMAGE_TYPE.PHYSICAL]: 0,
    [DAMAGE_TYPE.FIRE]: 0,
    [DAMAGE_TYPE.COLD]: 0,
    [DAMAGE_TYPE.LIGHTNING]: 0,
    [DAMAGE_TYPE.POISON]: 0,
  };
}

/**
 * @param {Record<string, number> | null | undefined} resistances
 * @param {string} damageType
 */
export function getResistance(resistances, damageType) {
  return resistances?.[damageType] ?? 0;
}
