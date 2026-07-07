import { musicMoodForMap } from '/shared/audioSettings.js';
import { TILE_SIZE } from '../config.js';

const HIT_RANGE_PX = TILE_SIZE * 8;

/**
 * Plays contextual SFX from world-state and FX changes.
 */
export class GameAudio {
  /** @param {import('./AudioManager.js').AudioManager} audio */
  constructor(audio) {
    this.audio = audio;
    this.lastMapId = null;
    this.wasDead = false;
    /** @type {Set<string>} */
    this.seenCombatKeys = new Set();
    this.seenCombatLimit = 200;
  }

  /** @param {import('../game/Game.js').Game} game @param {object} state @param {object[]} combatFx */
  onWorldState(game, state, combatFx = []) {
    if (!state?.player) return;

    const mapId = state.map?.mapId ?? null;
    if (mapId && mapId !== this.lastMapId) {
      if (this.lastMapId != null) {
        this.audio.playSfx('zone');
      }
      this.audio.setMusicMood(musicMoodForMap(state.map));
      this.lastMapId = mapId;
    } else if (this.lastMapId == null && mapId) {
      this.audio.setMusicMood(musicMoodForMap(state.map));
      this.lastMapId = mapId;
    }

    const dead = !!state.player.dead;
    if (dead && !this.wasDead) {
      this.audio.playSfx('death');
    }
    this.wasDead = dead;

    this.ingestCombatFx(game, combatFx);
  }

  reset() {
    this.lastMapId = null;
    this.wasDead = false;
    this.seenCombatKeys.clear();
  }

  /** @param {import('../game/Game.js').Game} game @param {object[]} combatFx */
  ingestCombatFx(game, combatFx) {
    const px = game.displayPlayer?.x ?? game.worldState?.player?.x;
    const py = game.displayPlayer?.y ?? game.worldState?.player?.y;
    if (px == null || py == null) return;

    for (const fx of combatFx) {
      const key = combatKey(fx);
      if (this.seenCombatKeys.has(key)) continue;
      this.seenCombatKeys.add(key);
      if (this.seenCombatKeys.size > this.seenCombatLimit) {
        const first = this.seenCombatKeys.values().next().value;
        this.seenCombatKeys.delete(first);
      }

      if (fx.type !== 'damage' && fx.type !== 'hitFlash') continue;
      const dx = (fx.x ?? 0) - px;
      const dy = (fx.y ?? 0) - py;
      if (Math.hypot(dx, dy) > HIT_RANGE_PX) continue;
      this.audio.playSfx('hit', { minIntervalMs: 80 });
    }
  }
}

function combatKey(fx) {
  if (fx.type === 'damage') return `d-${fx.at}-${fx.x}-${fx.y}-${fx.value}`;
  if (fx.type === 'hitFlash') return `h-${fx.at}-${fx.monsterId}`;
  return `x-${fx.at}-${fx.type}`;
}
