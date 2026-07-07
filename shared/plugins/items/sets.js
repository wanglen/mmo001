import itemSetsData from '../../content/itemSets.json' with { type: 'json' };

/** @type {Record<string, object>} */
export const ITEM_SETS = itemSetsData.sets ?? {};

/** @param {string} templateKey */
export function getSetForTemplate(templateKey) {
  for (const [setId, def] of Object.entries(ITEM_SETS)) {
    if (def.pieces?.includes(templateKey)) return setId;
  }
  return null;
}

/**
 * @param {object} equipment
 * @returns {Record<string, number>}
 */
export function getSetBonuses(equipment) {
  const wornBySet = {};

  for (const item of Object.values(equipment ?? {})) {
    if (!item?.setId) continue;
    wornBySet[item.setId] = (wornBySet[item.setId] ?? 0) + 1;
  }

  const bonuses = {};
  for (const [setId, count] of Object.entries(wornBySet)) {
    const def = ITEM_SETS[setId];
    if (!def?.bonuses) continue;

  for (const tier of Object.keys(def.bonuses)
    .map(Number)
    .sort((a, b) => a - b)) {
    if (count >= tier) {
      for (const [stat, value] of Object.entries(def.bonuses[String(tier)])) {
        bonuses[stat] = (bonuses[stat] ?? 0) + value;
      }
    }
  }
  }

  return bonuses;
}

/**
 * Active set bonus lines for UI.
 * @param {object} equipment
 * @returns {Array<{ setId: string, name: string, worn: number, activeTier: number, bonuses: Record<string, number> }>}
 */
export function getActiveSetInfo(equipment) {
  const wornBySet = {};
  for (const item of Object.values(equipment ?? {})) {
    if (!item?.setId) continue;
    wornBySet[item.setId] = (wornBySet[item.setId] ?? 0) + 1;
  }

  const result = [];
  for (const [setId, worn] of Object.entries(wornBySet)) {
    const def = ITEM_SETS[setId];
    if (!def) continue;

    const tiers = Object.keys(def.bonuses)
      .map(Number)
      .sort((a, b) => b - a);

    let activeTier = 0;
    let activeBonuses = {};
    for (const tier of tiers) {
      if (worn >= tier) {
        activeTier = tier;
        activeBonuses = def.bonuses[String(tier)];
        break;
      }
    }

    result.push({
      setId,
      name: def.name,
      worn,
      pieceCount: def.pieces?.length ?? 0,
      activeTier,
      bonuses: activeBonuses,
    });
  }

  return result;
}
