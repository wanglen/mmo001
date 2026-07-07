import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  clampVolume,
  parseAudioSettings,
  musicMoodForMap,
  DEFAULT_AUDIO_SETTINGS,
} from '../../shared/audioSettings.js';
import { MAP_ID } from '../../shared/worldMaps.js';

describe('audioSettings', () => {
  it('clampVolume bounds 0–1', () => {
    assert.equal(clampVolume(0.5), 0.5);
    assert.equal(clampVolume(2), 1);
    assert.equal(clampVolume(-1), 0);
    assert.equal(clampVolume('bad', 0.3), 0.3);
  });

  it('parseAudioSettings merges defaults', () => {
    const settings = parseAudioSettings(JSON.stringify({ sfxVolume: 0.5 }));
    assert.equal(settings.sfxVolume, 0.5);
    assert.equal(settings.musicVolume, DEFAULT_AUDIO_SETTINGS.musicVolume);
    assert.equal(settings.muted, false);
  });

  it('musicMoodForMap picks mood by map id', () => {
    assert.equal(musicMoodForMap({ mapId: MAP_ID.TOWN }), 'town');
    assert.equal(musicMoodForMap({ mapId: MAP_ID.DUNGEON }), 'dungeon');
    assert.equal(musicMoodForMap({ mapId: MAP_ID.WILDERNESS }), 'wilderness');
  });
});
