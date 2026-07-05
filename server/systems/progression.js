import { allocateStatPoint } from '../../shared/stats.js';
import { refreshPlayerDerivedStats } from '../../shared/inventory.js';

export function allocateStat(player, statName) {
  const result = allocateStatPoint(player, statName, player.characterClass);
  if (result.ok) refreshPlayerDerivedStats(player, player.equipment);
  return result;
}
