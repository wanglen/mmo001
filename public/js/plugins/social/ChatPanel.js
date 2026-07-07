import { CHAT_CHANNEL, chatChannelLabel } from '/shared/social.js';

const MAX_LINES = 80;

export class ChatPanel {
  constructor(rootEl) {
    this.root = rootEl;
    this.logEl = rootEl?.querySelector('[data-chat-log]');
    this.inputEl = rootEl?.querySelector('[data-chat-input]');
    this.channelEl = rootEl?.querySelector('[data-chat-channel]');
    this.messages = [];
    this.channel = CHAT_CHANNEL.GLOBAL;
    this.onSend = null;
    this.focused = false;

    this.channelEl?.addEventListener('change', () => {
      this.channel = this.channelEl.value;
    });

    this.inputEl?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.submit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.blur();
      }
      e.stopPropagation();
    });

    this.inputEl?.addEventListener('focus', () => {
      this.focused = true;
      this.root?.classList.add('chat-panel--focused');
      this.onFocus?.();
    });

    this.inputEl?.addEventListener('blur', () => {
      this.focused = false;
      this.root?.classList.remove('chat-panel--focused');
    });
  }

  isFocused() {
    return this.focused || document.activeElement === this.inputEl;
  }

  focus() {
    this.inputEl?.focus();
  }

  blur() {
    this.inputEl?.blur();
    this.canvas?.focus?.();
  }

  setCanvas(canvas) {
    this.canvas = canvas;
  }

  appendMessage(message) {
    if (!message?.text) return;
    this.messages.push(message);
    if (this.messages.length > MAX_LINES) {
      this.messages.splice(0, this.messages.length - MAX_LINES);
    }
    this.render();
  }

  submit() {
    const text = this.inputEl?.value?.trim();
    if (!text || !this.onSend) return;
    this.onSend({ text, channel: this.channel });
    if (this.inputEl) this.inputEl.value = '';
  }

  render() {
    if (!this.logEl) return;

    this.logEl.innerHTML = this.messages
      .map((msg) => {
        const label = chatChannelLabel(msg.channel, msg.mapLabel);
        const prefix =
          msg.channel === CHAT_CHANNEL.WHISPER
            ? `[${label}] ${msg.from} → ${msg.to}:`
            : msg.channel === CHAT_CHANNEL.SYSTEM
              ? `[${label}]`
              : `[${label}] ${msg.from}:`;
        const cls =
          msg.channel === CHAT_CHANNEL.SYSTEM
            ? 'chat-line chat-line--system'
            : msg.channel === CHAT_CHANNEL.WHISPER
              ? 'chat-line chat-line--whisper'
              : 'chat-line';
        return `<div class="${cls}"><span class="chat-prefix">${escapeHtml(prefix)}</span> ${escapeHtml(msg.text)}</div>`;
      })
      .join('');

    this.logEl.scrollTop = this.logEl.scrollHeight;
  }

  show() {
    this.root?.classList.remove('hidden');
  }

  hide() {
    this.root?.classList.add('hidden');
    this.blur();
  }
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
