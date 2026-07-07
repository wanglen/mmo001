import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildParticleBurst,
  PARTICLE_PRESETS,
  pickColor,
  skillParticlePreset,
} from '../../../../shared/plugins/render/particles.js';

describe('particles', () => {
  it('buildParticleBurst creates the configured count', () => {
    const burst = buildParticleBurst(PARTICLE_PRESETS.blood, 10, 20, () => 0.5);
    assert.equal(burst.length, PARTICLE_PRESETS.blood.count);
    assert.equal(burst[0].x, 10);
    assert.equal(burst[0].y, 20);
    assert.ok(burst[0].life > 0);
  });

  it('pickColor selects from palette', () => {
    assert.equal(pickColor(['#111', '#222'], () => 0), '#111');
    assert.equal(pickColor(['#111', '#222'], () => 0.99), '#222');
  });

  it('skillParticlePreset maps skill families', () => {
    assert.equal(skillParticlePreset('frost_nova'), 'spellIce');
    assert.equal(skillParticlePreset('fireball'), 'spellFire');
    assert.equal(skillParticlePreset('cleave'), 'slash');
    assert.equal(skillParticlePreset('chain_spark'), 'spellArcane');
  });
});
