import { sortPlugins } from '../../../shared/plugins/sortPlugins.js';
import { corePlugin } from '../plugins/core/index.js';
import { questsPlugin } from '../plugins/quests/index.js';
import { socialPlugin } from '../plugins/social/index.js';
import { economyPlugin } from '../plugins/economy/index.js';

/** @returns {import('../../../shared/plugins/types.js').ClientPlugin[]} */
export function loadClientPlugins() {
  return sortPlugins([corePlugin, questsPlugin, socialPlugin, economyPlugin]);
}
