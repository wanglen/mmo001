import { InventoryPanel } from '../../ui/InventoryPanel.js';
import { StashPanel } from '../../ui/StashPanel.js';
import { SkillBar } from '../../ui/SkillBar.js';
import { LevelUpPanel } from '../../ui/LevelUpPanel.js';
import { SkillTreePanel } from '../../ui/SkillTreePanel.js';
import { Game } from '../../game/Game.js';
import { CharacterSelect } from './CharacterSelect.js';
import { DisconnectModal } from './DisconnectModal.js';

/** @param {import('../../../../shared/plugins/types.js').ClientContext} ctx */
export function registerCoreClient(ctx) {
  const { socketClient, canvas } = ctx;

  const inventoryPanel = new InventoryPanel(document.getElementById('inventory-panel'));
  inventoryPanel.onEquip = (index) => socketClient.sendEquip(index);
  inventoryPanel.onUnequip = (slot) => socketClient.sendUnequip(slot);
  inventoryPanel.onUseConsumable = (index) => socketClient.sendUseConsumable(index);
  inventoryPanel.onDestroy = ({ inventoryIndex, slot }) =>
    socketClient.sendDestroyItem({ inventoryIndex, slot });
  inventoryPanel.onStoreInStash = (inventoryIndex) => socketClient.sendStashStore(inventoryIndex);
  inventoryPanel.onSocketGem = (payload) => socketClient.sendSocketGem(payload);

  const stashPanel = new StashPanel(document.getElementById('stash-panel'));
  stashPanel.onTake = (stashIndex) => socketClient.sendStashTake(stashIndex);

  const skillBar = new SkillBar(document.getElementById('skill-bar'));

  const levelUpPanel = new LevelUpPanel(
    document.getElementById('level-up-panel'),
    document.getElementById('level-up-flash')
  );
  levelUpPanel.onAllocate = (stat) => socketClient.sendAllocateStat(stat);
  levelUpPanel.onRequestCanvasFocus = () => canvas.focus();

  const skillTreePanel = new SkillTreePanel(document.getElementById('skill-tree-panel'));
  skillTreePanel.onLearn = (skillId) => socketClient.sendLearnSkill(skillId);
  skillTreePanel.onSetSlot = (slotIndex, skillId) =>
    socketClient.sendSetSkillSlot(slotIndex, skillId);
  skillTreePanel.onRespec = () => socketClient.sendRespecSkills();
  skillTreePanel.onRequestCanvasFocus = () => canvas.focus();

  const disconnectModal = new DisconnectModal(
    document.getElementById('disconnect-overlay'),
    document.getElementById('disconnect-message'),
    document.getElementById('disconnect-reload-btn')
  );
  disconnectModal.onReload = () => {
    const message = document.getElementById('disconnect-message')?.textContent;
    if (message) sessionStorage.setItem('mmo_disconnect_msg', message);
    window.location.reload();
  };

  ctx.panels.inventoryPanel = inventoryPanel;
  ctx.panels.stashPanel = stashPanel;
  ctx.panels.skillBar = skillBar;
  ctx.panels.levelUpPanel = levelUpPanel;
  ctx.panels.skillTreePanel = skillTreePanel;
  ctx.setDisconnectModal(disconnectModal);
}

/**
 * Create Game and CharacterSelect after all client plugins registered.
 * @param {import('../../../../shared/plugins/types.js').ClientContext} ctx
 */
export function finalizeCoreClient(ctx) {
  const { socketClient, canvas, pluginHost } = ctx;
  const {
    inventoryPanel,
    stashPanel,
    skillBar,
    levelUpPanel,
    skillTreePanel,
    dialoguePanel,
    questTracker,
    chatPanel,
    socialPanel,
    vendorPanel,
    tradePanel,
  } = ctx.panels;

  const game = new Game(
    canvas,
    socketClient,
    inventoryPanel,
    stashPanel,
    levelUpPanel,
    skillBar,
    skillTreePanel,
    dialoguePanel,
    questTracker,
    chatPanel,
    socialPanel,
    vendorPanel,
    tradePanel,
    pluginHost
  );
  levelUpPanel.onPauseChange = (paused) => game.onGamePause(paused);
  skillTreePanel.onPauseChange = (paused) => game.onGamePause(paused);
  ctx.setGame(game);

  const characterSelect = new CharacterSelect({
    socketClient,
    onStart: () => {
      ctx.setInGame(true);
      chatPanel?.show();
      socialPanel?.show();
      game.start();
    },
  });
  ctx.setCharacterSelect(characterSelect);

  socketClient.onWorldState((state) => game.setWorldState(state));
}

/** @type {import('../../../../shared/plugins/types.js').ClientPlugin} */
export const corePlugin = {
  id: 'core',
  dependsOn: [],
  registerClient: registerCoreClient,
};
