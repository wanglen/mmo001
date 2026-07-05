export const BASE_STATS = {
  warrior: { hp: 120, mp: 30, str: 15, dex: 8, int: 5, vit: 12 },
  mage: { hp: 70, mp: 100, str: 5, dex: 8, int: 15, vit: 6 },
  ranger: { hp: 90, mp: 50, str: 8, dex: 15, int: 8, vit: 9 },
};

export const STAT_NAMES = ['hp', 'mp', 'str', 'dex', 'int', 'vit'];

/**
 * Create initial stats for a new character.
 */
export function createPlayerStats(characterClass, level = 1) {
  const base = BASE_STATS[characterClass] ?? BASE_STATS.warrior;
  const levelBonus = level - 1;

  const stats = {
    level,
    xp: 0,
    str: base.str + levelBonus * 2,
    dex: base.dex + levelBonus,
    int: base.int + levelBonus,
    vit: base.vit + levelBonus * 2,
  };

  stats.maxHp = base.hp + stats.vit * 5;
  stats.hp = stats.maxHp;
  stats.maxMp = base.mp + stats.int * 3;
  stats.mp = stats.maxMp;

  return stats;
}

/** XP required to reach the next level from current level. */
export function xpToNextLevel(level) {
  return 100 + (level - 1) * 50;
}

/** Apply one level-up: scale stats and refill HP/MP. */
export function applyLevelUp(stats, characterClass) {
  const base = BASE_STATS[characterClass] ?? BASE_STATS.warrior;
  stats.level += 1;
  const levelBonus = stats.level - 1;

  stats.str = base.str + levelBonus * 2;
  stats.dex = base.dex + levelBonus;
  stats.int = base.int + levelBonus;
  stats.vit = base.vit + levelBonus * 2;
  stats.maxHp = base.hp + stats.vit * 5;
  stats.hp = stats.maxHp;
  stats.maxMp = base.mp + stats.int * 3;
  stats.mp = stats.maxMp;
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
