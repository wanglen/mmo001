import { MUSIC_TRACKS } from '/shared/musicTracks.js';

const FADE_SEC = 0.8;

/**
 * Loops decoded OGG zone music with crossfades between moods.
 */
export class MusicPlayer {
  /** @param {AudioContext} ctx @param {GainNode} bus */
  constructor(ctx, bus) {
    this.ctx = ctx;
    this.bus = bus;
    /** @type {Map<string, AudioBuffer>} */
    this.buffers = new Map();
    /** @type {AudioBufferSourceNode | null} */
    this.source = null;
    /** @type {GainNode | null} */
    this.gain = null;
    /** @type {string | null} */
    this.currentMood = null;
    this.loadPromise = null;
  }

  /** @param {import('/shared/musicTracks.js').MusicMood} mood */
  async ensureLoaded(mood) {
    if (this.buffers.has(mood)) return;
    if (!this.loadPromise) {
      this.loadPromise = this.preloadAll();
    }
    await this.loadPromise;
    if (!this.buffers.has(mood)) {
      throw new Error(`Music track missing: ${mood}`);
    }
  }

  async preloadAll() {
    const entries = Object.entries(MUSIC_TRACKS);
    await Promise.all(
      entries.map(async ([mood, url]) => {
        if (this.buffers.has(mood)) return;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to load music ${url}: ${response.status}`);
        }
        const data = await response.arrayBuffer();
        const buffer = await this.ctx.decodeAudioData(data);
        this.buffers.set(mood, buffer);
      })
    );
  }

  /**
   * @param {import('/shared/musicTracks.js').MusicMood} mood
   */
  async playMood(mood) {
    if (this.currentMood === mood && this.source) return;

    await this.ensureLoaded(mood);
    const buffer = this.buffers.get(mood);
    if (!buffer) return;

    const ctx = this.ctx;
    const t = ctx.currentTime;
    this.stopSource(FADE_SEC);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(1, t + FADE_SEC);

    source.connect(gain);
    gain.connect(this.bus);
    source.start(t);

    this.source = source;
    this.gain = gain;
    this.currentMood = mood;
  }

  /** @param {number} [fadeSec] */
  stop(fadeSec = FADE_SEC) {
    this.stopSource(fadeSec);
    this.currentMood = null;
  }

  /** @param {number} fadeSec */
  stopSource(fadeSec) {
    if (!this.source || !this.gain) return;

    const ctx = this.ctx;
    const t = ctx.currentTime;
    const source = this.source;
    const gain = this.gain;

    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(gain.gain.value, t);
    gain.gain.linearRampToValueAtTime(0, t + fadeSec);

    source.stop(t + fadeSec + 0.05);
    this.source = null;
    this.gain = null;
  }
}
