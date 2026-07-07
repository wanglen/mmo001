import { tileToPixel } from '../../map/collision.js';
import { refreshPlayerDerivedStats } from '../../../shared/inventory.js';
import { isPlayerAlive } from '../../../shared/playerLife.js';
import { clearStatusEffects } from '../../../shared/combat.js';
import { DEFAULT_MAP_ID } from '../../../shared/worldMaps.js';

/**
 * Mark player dead when joining with 0 HP from a saved character.
 * @param {object} player
 */
export function syncDeathState(player) {
  if ((player.hp ?? 0) <= 0) {
    player.hp = 0;
    player.dead = true;
    player.moving = false;
    player.attacking = false;
  }
}

/**
 * Teleport to spawn and restore HP/MP.
 * @param {object} player
 * @param {object} map
 */
export function respawnPlayer(player, map) {
  const { x, y } = tileToPixel(map.spawn.x, map.spawn.y);

  player.mapId = map.mapId ?? DEFAULT_MAP_ID;
  player.x = x;
  player.y = y;
  player.aimX = x + 1;
  player.aimY = y;
  player.dead = false;
  player.moving = false;
  player.attacking = false;
  player.lastAttackAt = 0;
  player.lastSkillAt = 0;
  player.lastDamagedAt = 0;
  player.skillCooldowns = {};
  clearStatusEffects(player);

  refreshPlayerDerivedStats(player, player.equipment);
  player.hp = player.maxHp;
  player.mp = player.maxMp;
}

export { isPlayerAlive };
