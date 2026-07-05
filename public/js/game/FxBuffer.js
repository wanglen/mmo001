import { COMBAT_FX_MAX_AGE_MS } from '/shared/combatFx.js';

/** Accumulates server combat/skill FX between socket updates; prunes by wall-clock time. */
export class FxBuffer {
  constructor() {
    this.combatFx = [];
    this.skillFx = [];
  }

  ingestCombat(incoming = []) {
    for (const fx of incoming) {
      const key = this.combatKey(fx);
      if (!this.combatFx.some((e) => e._key === key)) {
        this.combatFx.push({ ...fx, _key: key });
      }
    }
  }

  ingestSkill(incoming = []) {
    for (const fx of incoming) {
      if (fx.playerId && fx.playerId !== 'local') {
        this.skillFx = this.skillFx.filter(
          (e) => !(e.playerId === 'local' && e.skillId === fx.skillId)
        );
      }

      const key = `skill-${fx.at}-${fx.skillId}-${fx.playerId ?? ''}`;
      if (!this.skillFx.some((e) => e._key === key)) {
        this.skillFx.push({ ...fx, _key: key });
      }
    }
  }

  addSkillFx(fx) {
    const at = fx.at ?? Date.now();
    const key = `skill-local-${at}-${fx.skillId}`;
    this.skillFx.push({ ...fx, at, _key: key, playerId: 'local' });
  }

  combatKey(fx) {
    if (fx.type === 'damage') return `d-${fx.at}-${fx.x}-${fx.y}-${fx.value}`;
    if (fx.type === 'hitFlash') return `h-${fx.at}-${fx.monsterId}`;
    return `x-${fx.at}-${fx.type}`;
  }

  prune() {
    const now = Date.now();
    this.combatFx = this.combatFx.filter((fx) => now - fx.at < COMBAT_FX_MAX_AGE_MS);
    this.skillFx = this.skillFx.filter((fx) => {
      const duration = fx.durationMs ?? 600;
      return now - fx.at < duration + 250;
    });
  }

  getCombatFx() {
    this.prune();
    return this.combatFx;
  }

  getSkillFx() {
    this.prune();
    return this.skillFx;
  }
}
