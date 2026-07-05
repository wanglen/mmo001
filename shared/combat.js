export const ATTACK_RANGE = 48;
export const ATTACK_COOLDOWN_MS = 600;
export const ATTACK_ANIM_MS = 250;
export const MONSTER_HIT_RADIUS = 18;

export function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

export function calculateDamage(attackerStr, defenderVit = 0) {
  const base = Math.max(1, attackerStr * 2 - Math.floor(defenderVit * 0.5));
  const variance = Math.floor(Math.random() * 3);
  return base + variance;
}

export function isInRange(x1, y1, x2, y2, range = ATTACK_RANGE) {
  return distance(x1, y1, x2, y2) <= range;
}

export function canAttackNow(lastAttackAt, now = Date.now()) {
  return now - lastAttackAt >= ATTACK_COOLDOWN_MS;
}

export function findMonsterAt(monsters, x, y, radius = MONSTER_HIT_RADIUS) {
  let best = null;
  let bestDist = radius;

  for (const monster of monsters) {
    if (monster.hp <= 0) continue;
    const d = distance(x, y, monster.x, monster.y);
    if (d <= bestDist) {
      best = monster;
      bestDist = d;
    }
  }

  return best;
}

export function findNearestMonsterInRange(player, monsters, range = ATTACK_RANGE) {
  let best = null;
  let bestDist = range;

  for (const monster of monsters) {
    if (monster.hp <= 0) continue;
    const d = distance(player.x, player.y, monster.x, monster.y);
    if (d <= bestDist) {
      best = monster;
      bestDist = d;
    }
  }

  return best;
}
