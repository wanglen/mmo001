import * as coreInput from '../plugins/core/CoreInput.js';
import * as combatInput from '../plugins/combat/CombatInput.js';
import * as worldInput from '../plugins/world/InteractionInput.js';

/**
 * Routes frame input through core, combat, and world handlers.
 * Chat focus is checked first as an escape hatch before modal blocking.
 */
export class InputRouter {
  /** @param {import('../game/Game.js').Game} game */
  constructor(game) {
    this.game = game;
  }

  /** @param {number} timestamp */
  handleInput(timestamp) {
    const game = this.game;
    if (game.gamePaused || game.isDead) return;

    if (coreInput.handleChatFocus(game)) return;

    coreInput.handleTownRecallCast(game);

    coreInput.handleInventoryToggle(game);
    coreInput.handleStashToggle(game);
    coreInput.handleSettingsToggle(game);
    if (game.inventoryVisible || game.stashVisible || game.settingsVisible) {
      combatInput.handlePotionHotkeys(game);
      combatInput.handleSkills(game);
      return;
    }

    if (game.pluginHost?.blocksGameInput()) return;

    worldInput.handleClick(game);
    combatInput.handlePotionHotkeys(game);
    combatInput.handleSkills(game);
    combatInput.handleAim(game, timestamp);
    combatInput.handleZoom(game);

    if (coreInput.handleKeyboardMove(game, timestamp)) return;

    worldInput.handleNpcChase(game, timestamp);
    worldInput.handlePortalChase(game, timestamp);
    worldInput.handleLootChase(game, timestamp);
    combatInput.handleAttackChase(game, timestamp);
    coreInput.handlePathFollowerMove(game, timestamp);
  }
}
