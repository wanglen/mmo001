import { isTownHubMap } from '/shared/townHub.js';

export const MOVE_INTERVAL = 50;

/** @param {import('../../game/Game.js').Game} game @returns {boolean} */
export function handleChatFocus(game) {
  if (game.input.consumeKeyPress('enter')) {
    game.chatPanel?.focus();
    return true;
  }
  return !!game.chatPanel?.isFocused();
}

/** @param {import('../../game/Game.js').Game} game */
export function handleTownRecallCast(game) {
  if (game.gamePaused || game.isDead || game.isRecalling()) return;
  if (isTownHubMap(game.worldState?.map)) return;
  if (game.dialoguePanel?.isVisible() || game.levelUpPanel?.isVisible() || game.skillTreePanel?.isVisible() || game.settingsVisible) return;
  if (!game.input.consumeKeyPress('t')) return;

  game.pathFollower.clear();
  game.attackTargetId = null;
  game.lootTargetId = null;
  game.socketClient.sendCastTownRecall();
}

/** @param {import('../../game/Game.js').Game} game */
export function handleStashToggle(game) {
  if (game.gamePaused) return;
  if (!isTownHubMap(game.worldState?.map)) return;
  if (game.input.consumeKeyPress('escape') && game.stashVisible) {
    game.setStashVisible(false);
    return;
  }
  if (!game.input.consumeKeyPress('b')) return;
  game.setStashVisible(!game.stashVisible);
}

/** @param {import('../../game/Game.js').Game} game */
export function handleSettingsToggle(game) {
  if (game.gamePaused) return;
  if (game.input.consumeKeyPress('escape') && game.settingsVisible) {
    game.setSettingsVisible(false);
    return;
  }
  if (!game.input.consumeKeyPress('o')) return;
  game.toggleSettingsPanel();
}

/** @param {import('../../game/Game.js').Game} game */
export function handleInventoryToggle(game) {
  if (game.gamePaused) return;
  if (game.input.consumeKeyPress('escape') && game.inventoryVisible) {
    game.setInventoryVisible(false);
    return;
  }
  if (!game.input.consumeKeyPress('i')) return;
  game.setInventoryVisible(!game.inventoryVisible);
}

/**
 * @param {import('../../game/Game.js').Game} game
 * @param {number} timestamp
 * @returns {boolean} true when keyboard movement consumed the tick
 */
export function handleKeyboardMove(game, timestamp) {
  const keyboardDirection = game.input.getDirection();
  if (!keyboardDirection) return false;

  game.attackTargetId = null;
  game.lootTargetId = null;
  game.pathFollower.clear();
  if (timestamp - game.lastMoveTime >= MOVE_INTERVAL) {
    game.socketClient.sendMove(keyboardDirection);
    game.lastMoveTime = timestamp;
  }
  return true;
}

/**
 * @param {import('../../game/Game.js').Game} game
 * @param {number} timestamp
 */
export function handlePathFollowerMove(game, timestamp) {
  if (!game.pathFollower.isActive() || !game.displayPlayer) {
    if (game.displayPlayer) game.displayPlayer.moving = false;
    return;
  }

  const origin = game.worldState?.player ?? game.displayPlayer;
  const direction = game.pathFollower.getDirection(origin.x, origin.y);
  if (!direction) {
    if (game.displayPlayer) game.displayPlayer.moving = false;
    return;
  }

  if (timestamp - game.lastMoveTime >= MOVE_INTERVAL) {
    game.socketClient.sendMove(direction);
    game.lastMoveTime = timestamp;
  }
}

/** @param {import('../../game/Game.js').Game} game @param {KeyboardEvent} e */
export function onSkillTreeKeyDown(game, e) {
  if (!game.input.gameActive || e.repeat) return;
  if (game.chatPanel?.isFocused()) return;
  if (game.settingsVisible) return;
  if (e.key.toLowerCase() !== 'k' && e.code !== 'KeyK') return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (!game.worldState?.player) return;

  e.preventDefault();
  e.stopPropagation();
  game.toggleSkillTreePanel();
}

/** @param {import('../../game/Game.js').Game} game @param {KeyboardEvent} e */
export function onStatKeyDown(game, e) {
  if (!game.input.gameActive || e.repeat) return;
  if (game.chatPanel?.isFocused()) return;
  if (game.settingsVisible) return;
  if (e.key.toLowerCase() !== 'c' && e.code !== 'KeyC') return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (!game.worldState?.player) return;

  e.preventDefault();
  e.stopPropagation();
  game.toggleStatPanel();
}
