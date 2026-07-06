import { corePlugin } from '../plugins/core/index.js';
import { combatPlugin } from '../plugins/combat/index.js';
import { lootPlugin } from '../plugins/loot/index.js';
import { questsPlugin } from '../plugins/quests/index.js';
import { socialPlugin } from '../plugins/social/index.js';
import { economyPlugin } from '../plugins/economy/index.js';
import { sortPlugins } from './sortPlugins.js';

const ALL_PLUGINS = [
  corePlugin,
  combatPlugin,
  lootPlugin,
  questsPlugin,
  socialPlugin,
  economyPlugin,
];

/** @returns {import('../../shared/plugins/types.js').ServerPlugin[]} */
export function loadPlugins() {
  return sortPlugins(ALL_PLUGINS);
}
