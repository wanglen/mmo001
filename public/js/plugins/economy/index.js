import { VendorPanel } from './VendorPanel.js';
import { TradePanel } from './TradePanel.js';

/** @param {import('../../../../shared/plugins/types.js').ClientContext} ctx */
export function registerEconomyClient(ctx) {
  const { socketClient } = ctx;

  const vendorPanel = new VendorPanel(document.getElementById('vendor-panel'));
  vendorPanel.onBuy = (npcId, templateKey) => socketClient.sendVendorBuy(npcId, templateKey);
  vendorPanel.onSell = (npcId, inventoryIndex) => socketClient.sendVendorSell(npcId, inventoryIndex);
  vendorPanel.onSellPotions = (npcId, templateKey, rarity, quantity) =>
    socketClient.sendVendorSellPotions(npcId, templateKey, rarity, quantity);

  const tradePanel = new TradePanel(document.getElementById('trade-panel'));
  tradePanel.onAccept = () => socketClient.sendTradeAccept();
  tradePanel.onDecline = () => socketClient.sendTradeDecline();
  tradePanel.onCancel = () => socketClient.sendTradeCancel();
  tradePanel.onUpdate = (offer) => socketClient.sendTradeUpdate(offer);
  tradePanel.onReady = (ready) => socketClient.sendTradeReady(ready);

  ctx.registerPanel('vendor', vendorPanel, { blocksInput: true, zIndex: 20 });
  ctx.registerPanel('trade', tradePanel, { blocksInput: true, zIndex: 21 });
  ctx.panels.vendorPanel = vendorPanel;
  ctx.panels.tradePanel = tradePanel;

  socketClient.onVendorCatalog(({ catalog, npcId }) => {
    ctx.pluginHost.game?.openVendor(npcId, catalog);
  });
  socketClient.onTradeState((state) => {
    ctx.pluginHost.game?.updateTradeState(state);
  });
}

/** @type {import('../../../../shared/plugins/types.js').ClientPlugin} */
export const economyPlugin = {
  id: 'economy',
  dependsOn: ['core'],
  registerClient: registerEconomyClient,
};
