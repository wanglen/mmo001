import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MUSIC_TRACKS } from '../../shared/musicTracks.js';

describe('musicTracks', () => {
  it('defines paths for all zone moods', () => {
    assert.equal(MUSIC_TRACKS.town, '/assets/audio/music/town.ogg');
    assert.equal(MUSIC_TRACKS.wilderness, '/assets/audio/music/wilderness.ogg');
    assert.equal(MUSIC_TRACKS.dungeon, '/assets/audio/music/dungeon.ogg');
  });
});
