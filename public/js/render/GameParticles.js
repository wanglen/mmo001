import { TILE_SIZE } from '../config.js';
import { skillParticlePreset } from '/shared/plugins/render/particles.js';

const HIT_RANGE_PX = TILE_SIZE * 10;

/**
 * Spawns particles from combat, skills, and level-up events.
 */
export class GameParticles {
  /** @param {import('./ParticleSystem.js').ParticleSystem} particles */
  constructor(particles) {
    this.particles = particles;
    /** @type {Set<string>} */
    this.seenCombatKeys = new Set();
    /** @type {Set<string>} */
    this.seenSkillKeys = new Set();
  }

  /**
   * @param {import('../game/Game.js').Game} game
   * @param {object} state
   * @param {object[]} combatFx
   * @param {object[]} skillFx
   */
  onWorldState(game, state, combatFx = [], skillFx = []) {
    this.ingestCombatFx(game, combatFx);
    this.ingestSkillFx(skillFx);
  }

  /** @param {import('../game/Game.js').Game} game */
  onLevelUp(game) {
    const player = game.displayPlayer ?? game.worldState?.player;
    if (!player) return;
    this.particles.emitBurst(player.x, player.y, 'levelUp');
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {string} skillId
   */
  onLocalSkill(x, y, skillId) {
    this.particles.emitBurst(x, y, skillParticlePreset(skillId));
  }

  reset() {
    this.seenCombatKeys.clear();
    this.seenSkillKeys.clear();
    this.particles.clear();
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
      trimSet(this.seenCombatKeys, 200);

      if (fx.type !== 'damage' && fx.type !== 'hitFlash') continue;

      const dx = (fx.x ?? 0) - px;
      const dy = (fx.y ?? 0) - py;
      if (Math.hypot(dx, dy) > HIT_RANGE_PX) continue;

      this.particles.emitBurst(fx.x ?? px, fx.y ?? py, 'blood');
    }
  }

  /** @param {object[]} skillFx */
  ingestSkillFx(skillFx) {
    for (const fx of skillFx) {
      const key = skillKey(fx);
      if (this.seenSkillKeys.has(key)) continue;
      this.seenSkillKeys.add(key);
      trimSet(this.seenSkillKeys, 120);

      const x = fx.impactX ?? fx.targetX ?? fx.x;
      const y = fx.impactY ?? fx.targetY ?? fx.y;
      if (x == null || y == null || !fx.skillId) continue;

      this.particles.emitBurst(x, y, skillParticlePreset(fx.skillId));
    }
  }
}

function combatKey(fx) {
  if (fx.type === 'damage') return `d-${fx.at}-${fx.x}-${fx.y}-${fx.value}`;
  if (fx.type === 'hitFlash') return `h-${fx.at}-${fx.monsterId}`;
  return `x-${fx.at}-${fx.type}`;
}

function skillKey(fx) {
  return `s-${fx.at}-${fx.skillId}-${fx.playerId ?? ''}-${fx.impactX ?? fx.x}`;
}

/** @param {Set<string>} set @param {number} max */
function trimSet(set, max) {
  while (set.size > max) {
    const first = set.values().next().value;
    set.delete(first);
  }
}
