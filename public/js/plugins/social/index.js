import { CHAT_CHANNEL } from '/shared/social.js';
import { ChatPanel } from './ChatPanel.js';
import { SocialPanel } from './SocialPanel.js';

/** @param {import('../../../../shared/plugins/types.js').ClientContext} ctx */
export function registerSocialClient(ctx) {
  const { socketClient, canvas } = ctx;

  const chatPanel = new ChatPanel(document.getElementById('chat-panel'));
  chatPanel.setCanvas(canvas);
  chatPanel.onSend = ({ text, channel }) => socketClient.sendChat({ text, channel });

  const socialPanel = new SocialPanel(document.getElementById('social-panel'));
  socialPanel.onInvite = (targetName) => socketClient.sendPartyInvite(targetName);
  socialPanel.onAcceptInvite = () => socketClient.sendPartyAccept();
  socialPanel.onDeclineInvite = () => socketClient.sendPartyDecline();
  socialPanel.onLeaveParty = () => socketClient.sendPartyLeave();
  socialPanel.onTrade = (targetName) => socketClient.sendTradeRequest(targetName);

  ctx.registerPanel('chat', chatPanel);
  ctx.registerPanel('social', socialPanel);
  ctx.registerInputBlocker(() => chatPanel.isFocused());
  ctx.panels.chatPanel = chatPanel;
  ctx.panels.socialPanel = socialPanel;

  socketClient.onChatMessage((msg) => chatPanel.appendMessage(msg));
  socketClient.onOnlinePlayers((payload) => socialPanel.updateOnline(payload));
  socketClient.onPartyState((state) => socialPanel.updateParty(state));
}

/** @type {import('../../../../shared/plugins/types.js').ClientPlugin} */
export const socialPlugin = {
  id: 'social',
  dependsOn: ['core'],
  registerClient: registerSocialClient,
};
