import { DEFAULT_AUDIO_SETTINGS } from '/shared/audioSettings.js';

/** Reference list of default controls (rebinding not yet supported). */
export const DEFAULT_KEYBIND_REFERENCE = [
  { keys: 'Click', action: 'Move, attack, interact' },
  { keys: 'WASD / Arrows', action: 'Move (8-way)' },
  { keys: '1–7', action: 'Skill hotbar' },
  { keys: '8 / 9', action: 'Health / mana potion' },
  { keys: 'I / Esc', action: 'Inventory' },
  { keys: 'C', action: 'Character stats' },
  { keys: 'K', action: 'Skill tree' },
  { keys: 'B', action: 'Stash (town)' },
  { keys: 'T', action: 'Town recall (outside town)' },
  { keys: 'O / Esc', action: 'Settings' },
  { keys: 'Enter', action: 'Chat focus' },
];

/**
 * @param {import('/shared/audioSettings.js').AudioManagerLike} audio
 */
export class SettingsPanel {
  /** @param {HTMLElement | null} rootEl */
  constructor(rootEl) {
    this.root = rootEl;
    /** @type {import('/shared/audioSettings.js').AudioManagerLike | null} */
    this.audio = null;
    if (this.root) this.build();
  }

  build() {
    this.root.innerHTML = `
      <div class="settings-panel-inner panel">
        <h2>Settings</h2>
        <section class="settings-section">
          <h3>Audio</h3>
          <label class="settings-row">
            <span>Sound effects</span>
            <input type="range" min="0" max="100" step="1" data-sfx-volume />
          </label>
          <label class="settings-row">
            <span>Music</span>
            <input type="range" min="0" max="100" step="1" data-music-volume />
          </label>
          <label class="settings-row settings-check">
            <input type="checkbox" data-muted />
            <span>Mute all audio</span>
          </label>
        </section>
        <section class="settings-section">
          <h3>Graphics</h3>
          <p class="settings-note">Scroll wheel zooms the camera. Additional graphics options coming soon.</p>
        </section>
        <section class="settings-section">
          <h3>Controls</h3>
          <ul class="settings-keybinds" data-keybind-list></ul>
        </section>
        <button type="button" class="settings-close btn-secondary">Close</button>
      </div>
    `;

    this.sfxSlider = this.root.querySelector('[data-sfx-volume]');
    this.musicSlider = this.root.querySelector('[data-music-volume]');
    this.muteCheck = this.root.querySelector('[data-muted]');
    const list = this.root.querySelector('[data-keybind-list]');

    for (const entry of DEFAULT_KEYBIND_REFERENCE) {
      const li = document.createElement('li');
      li.innerHTML = `<kbd>${entry.keys}</kbd><span>${entry.action}</span>`;
      list.appendChild(li);
    }

    this.sfxSlider?.addEventListener('input', () => this.syncToAudio());
    this.musicSlider?.addEventListener('input', () => this.syncToAudio());
    this.muteCheck?.addEventListener('change', () => this.syncToAudio());
    this.root.querySelector('.settings-close')?.addEventListener('click', () => {
      this.onClose?.();
      this.hide();
    });
  }

  /** @type {(() => void) | null} */
  onClose = null;

  /** @param {import('/shared/audioSettings.js').AudioManagerLike} audio */
  bind(audio) {
    this.audio = audio;
    this.syncFromAudio();
  }

  syncFromAudio() {
    if (!this.audio || !this.sfxSlider) return;
    const { sfxVolume, musicVolume, muted } = this.audio.settings ?? DEFAULT_AUDIO_SETTINGS;
    this.sfxSlider.value = String(Math.round(sfxVolume * 100));
    this.musicSlider.value = String(Math.round(musicVolume * 100));
    this.muteCheck.checked = !!muted;
  }

  syncToAudio() {
    if (!this.audio) return;
    this.audio.updateSettings({
      sfxVolume: Number(this.sfxSlider?.value ?? 75) / 100,
      musicVolume: Number(this.musicSlider?.value ?? 35) / 100,
      muted: !!this.muteCheck?.checked,
    });
  }

  isVisible() {
    return !!this.root && !this.root.classList.contains('hidden');
  }

  show() {
    this.syncFromAudio();
    this.root?.classList.remove('hidden');
  }

  hide() {
    this.root?.classList.add('hidden');
  }

  setVisible(visible) {
    if (visible) this.show();
    else this.hide();
  }
}
