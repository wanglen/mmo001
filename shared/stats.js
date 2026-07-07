export const BASE_STATS = {
  warrior: { hp: 120, mp: 30, str: 15, dex: 8, int: 5, vit: 12 },
  mage: { hp: 70, mp: 100, str: 5, dex: 8, int: 15, vit: 6 },
  ranger: { hp: 90, mp: 50, str: 8, dex: 15, int: 8, vit: 9 },
};

export const STAT_NAMES = ['hp', 'mp', 'str', 'dex', 'int', 'vit'];
export const ALLOCATABLE_STATS = ['str', 'dex', 'int', 'vit'];

export const STAT_POINTS_PER_LEVEL = 5;
/** Granted on each level-up (first point available at level 2). */
export const SKILL_POINTS_PER_LEVEL = 1;

/**
 * XP required to reach the next level from the current level.
 * Quadratic curve: steeper requirements at higher levels.
 */
export function xpToNextLevel(level) {
  const l = Math.max(1, level);
  return Math.floor(50 * l * l + 50 * l);
}

/** Recompute max HP/MP from class base and current vit/int. */
export function recalculateDerivedStats(stats, characterClass) {
  const base = BASE_STATS[characterClass] ?? BASE_STATS.warrior;
  stats.maxHp = base.hp + stats.vit * 5;
  stats.maxMp = base.mp + stats.int * 3;
}

/**
 * Create initial stats for a new character.
 * @param {object} [options] - Optional persisted fields (xp, stats, hp, inventory state)
 */
export function createPlayerStats(characterClass, level = 1, options = {}) {
  const base = BASE_STATS[characterClass] ?? BASE_STATS.warrior;

  const stats = {
    level,
    xp: options.xp ?? 0,
    gold: options.gold ?? 0,
    statPoints: options.statPoints ?? 0,
    skillPoints: options.skillPoints ?? 0,
    str: options.str ?? base.str,
    dex: options.dex ?? base.dex,
    int: options.int ?? base.int,
    vit: options.vit ?? base.vit,
  };

  recalculateDerivedStats(stats, characterClass);
  stats.hp = options.hp ?? stats.maxHp;
  stats.mp = options.mp ?? stats.maxMp;

  return stats;
}

/** Apply one level-up: grant points and refill HP/MP (stats allocated manually). */
export function applyLevelUp(stats, characterClass) {
  stats.level += 1;
  stats.statPoints = (stats.statPoints ?? 0) + STAT_POINTS_PER_LEVEL;
  stats.skillPoints = (stats.skillPoints ?? 0) + SKILL_POINTS_PER_LEVEL;
  recalculateDerivedStats(stats, characterClass);
  stats.hp = stats.maxHp;
  stats.mp = stats.maxMp;
}

/** Spend one stat point on str/dex/int/vit. */
export function allocateStatPoint(stats, statName, characterClass) {
  if (!ALLOCATABLE_STATS.includes(statName)) {
    return { ok: false, reason: 'invalid_stat' };
  }
  if ((stats.statPoints ?? 0) < 1) {
    return { ok: false, reason: 'no_points' };
  }

  const prevMaxHp = stats.maxHp;
  const prevMaxMp = stats.maxMp;

  stats.statPoints -= 1;
  stats[statName] += 1;
  recalculateDerivedStats(stats, characterClass);
  stats.hp = Math.min(stats.maxHp, stats.hp + (stats.maxHp - prevMaxHp));
  stats.mp = Math.min(stats.maxMp, stats.mp + (stats.maxMp - prevMaxMp));

  return { ok: true, stat: statName };
}

/** Grant XP and level up while threshold is met. Returns summary for combat feedback. */
export function grantXp(stats, amount, characterClass) {
  if (amount <= 0) {
    return { xpGained: 0, levelsGained: 0, leveledUp: false };
  }

  stats.xp += amount;
  let levelsGained = 0;

  while (stats.xp >= xpToNextLevel(stats.level)) {
    stats.xp -= xpToNextLevel(stats.level);
    applyLevelUp(stats, characterClass);
    levelsGained += 1;
  }

  return { xpGained: amount, levelsGained, leveledUp: levelsGained > 0 };
}

export function statsToJSON(stats) {
  return {
    level: stats.level,
    xp: stats.xp,
    gold: stats.gold ?? 0,
    statPoints: stats.statPoints ?? 0,
    skillPoints: stats.skillPoints ?? 0,
    hp: stats.hp,
    maxHp: stats.maxHp,
    mp: stats.mp,
    maxMp: stats.maxMp,
    str: stats.str,
    dex: stats.dex,
    int: stats.int,
    vit: stats.vit,
  };
}
