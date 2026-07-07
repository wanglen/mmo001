import { MAP_ID } from './worldMaps.js';
import { isTownHubMap } from './townHub.js';

/** localStorage key for client audio preferences. */
export const AUDIO_SETTINGS_KEY = 'mmo001_audio';

/** @typedef {'town' | 'wilderness' | 'dungeon'} MusicMood */

/**
 * @typedef {object} AudioManagerLike
 * @property {{ sfxVolume: number, musicVolume: number, muted: boolean }} settings
 * @property {(patch: { sfxVolume?: number, musicVolume?: number, muted?: boolean }) => void} updateSettings
 */

export const DEFAULT_AUDIO_SETTINGS = {
  sfxVolume: 0.75,
  musicVolume: 0.35,
  muted: false,
};

/**
 * @param {number} value
 * @param {number} [fallback]
 */
export function clampVolume(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(1, Math.max(0, n));
}

/**
 * @param {string | null | undefined} raw
 */
export function parseAudioSettings(raw) {
  if (!raw) return { ...DEFAULT_AUDIO_SETTINGS };
  try {
    const parsed = JSON.parse(raw);
    return {
      sfxVolume: clampVolume(parsed.sfxVolume, DEFAULT_AUDIO_SETTINGS.sfxVolume),
      musicVolume: clampVolume(parsed.musicVolume, DEFAULT_AUDIO_SETTINGS.musicVolume),
      muted: !!parsed.muted,
    };
  } catch {
    return { ...DEFAULT_AUDIO_SETTINGS };
  }
}

/**
 * @param {{ mapId?: string } | null | undefined} map
 * @returns {MusicMood}
 */
export function musicMoodForMap(map) {
  if (isTownHubMap(map)) return 'town';
  if (map?.mapId === MAP_ID.DUNGEON) return 'dungeon';
  return 'wilderness';
}
