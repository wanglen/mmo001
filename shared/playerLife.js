/**
 * @param {object | null | undefined} player
 */
export function isPlayerAlive(player) {
  return !!player && !player.dead && (player.hp ?? 0) > 0;
}

/**
 * @param {object} player
 * @param {number} damage
 * @param {number} [now]
 * @returns {{ damage: number, killed: boolean }}
 */
export function applyPlayerDamage(player, damage, now = Date.now()) {
  const amount = Math.max(0, damage);
  player.hp = Math.max(0, (player.hp ?? 0) - amount);
  player.lastDamagedAt = now;

  if (player.hp <= 0) {
    player.dead = true;
    player.hp = 0;
    player.moving = false;
    player.attacking = false;
    return { damage: amount, killed: true };
  }

  return { damage: amount, killed: false };
}
