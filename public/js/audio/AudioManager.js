import {
  AUDIO_SETTINGS_KEY,
  DEFAULT_AUDIO_SETTINGS,
  parseAudioSettings,
  clampVolume,
} from '/shared/audioSettings.js';
import { playProceduralSfx } from './proceduralSfx.js';
import { MusicPlayer } from './MusicPlayer.js';

/** Client audio: procedural SFX + looped zone music with persisted volume prefs. */
export class AudioManager {
  constructor() {
    /** @type {AudioContext | null} */
    this.ctx = null;
    /** @type {GainNode | null} */
    this.sfxBus = null;
    /** @type {GainNode | null} */
    this.musicBus = null;
    /** @type {MusicPlayer | null} */
    this.musicPlayer = null;
    this.settings = { ...DEFAULT_AUDIO_SETTINGS };
    this.unlocked = false;
    this.musicActive = false;
    /** @type {'town' | 'wilderness' | 'dungeon' | null} */
    this.lastMusicMood = null;
    this.lastSfxAt = 0;
    this.loadSettings();
    this.bindUnlock();
  }

  loadSettings() {
    try {
      this.settings = parseAudioSettings(localStorage.getItem(AUDIO_SETTINGS_KEY));
    } catch {
      this.settings = { ...DEFAULT_AUDIO_SETTINGS };
    }
    this.applyVolumes();
  }

  saveSettings() {
    try {
      localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(this.settings));
    } catch {
      // storage optional
    }
  }

  bindUnlock() {
    const unlock = () => {
      if (this.unlocked) return;
      this.ensureContext();
      this.unlocked = true;
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('keydown', unlock);
    };
    document.addEventListener('pointerdown', unlock, { once: false });
    document.addEventListener('keydown', unlock, { once: false });
  }

  ensureContext() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }

    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
      this.sfxBus = this.ctx.createGain();
      this.musicBus = this.ctx.createGain();
      this.sfxBus.connect(this.ctx.destination);
      this.musicBus.connect(this.ctx.destination);
      this.musicPlayer = new MusicPlayer(this.ctx, this.musicBus);
      this.applyVolumes();
      return this.ctx;
    } catch {
      return null;
    }
  }

  applyVolumes() {
    const sfx = this.settings.muted ? 0 : this.settings.sfxVolume;
    const music = this.settings.muted ? 0 : this.settings.musicVolume;
    if (this.sfxBus) this.sfxBus.gain.value = sfx;
    if (this.musicBus) this.musicBus.gain.value = music;
  }

  /**
   * @param {{ sfxVolume?: number, musicVolume?: number, muted?: boolean }} patch
   */
  updateSettings(patch) {
    const wasMuted = this.settings.muted;
    if (patch.sfxVolume != null) {
      this.settings.sfxVolume = clampVolume(patch.sfxVolume, this.settings.sfxVolume);
    }
    if (patch.musicVolume != null) {
      this.settings.musicVolume = clampVolume(patch.musicVolume, this.settings.musicVolume);
    }
    if (patch.muted != null) this.settings.muted = !!patch.muted;
    this.applyVolumes();
    this.saveSettings();
    if (wasMuted && !this.settings.muted && this.lastMusicMood) {
      this.setMusicMood(this.lastMusicMood);
    }
  }

  /** Call when entering gameplay (after user gesture). */
  async resume() {
    this.ensureContext();
    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume().catch(() => {});
    }
    this.unlocked = true;
    try {
      await this.musicPlayer?.preloadAll();
    } catch {
      // tracks load on first zone change
    }
  }

  /**
   * @param {string} name
   * @param {{ minIntervalMs?: number }} [options]
   */
  playSfx(name, { minIntervalMs = 0 } = {}) {
    if (this.settings.muted) return;
    const now = Date.now();
    if (minIntervalMs > 0 && now - this.lastSfxAt < minIntervalMs) return;
    this.lastSfxAt = now;

    const ctx = this.ensureContext();
    if (!ctx || !this.sfxBus) return;
    playProceduralSfx(ctx, this.sfxBus, name);
  }

  /**
   * @param {'town' | 'wilderness' | 'dungeon'} mood
   */
  setMusicMood(mood) {
    this.lastMusicMood = mood;
    if (this.settings.muted) {
      this.stopMusicLoop();
      return;
    }

    this.ensureContext();
    if (!this.musicPlayer) return;

    this.musicActive = true;
    this.musicPlayer.playMood(mood).catch((err) => {
      console.warn('Zone music failed to play:', err);
      this.musicActive = false;
    });
  }

  stopMusicLoop() {
    this.musicPlayer?.stop();
    this.musicActive = false;
  }

  /** Stop all audio when leaving the game session. */
  shutdown() {
    this.stopMusicLoop();
    this.musicPlayer = null;
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
      this.sfxBus = null;
      this.musicBus = null;
    }
    this.unlocked = false;
  }
}
