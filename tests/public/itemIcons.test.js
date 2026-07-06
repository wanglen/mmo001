import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildItemIconSvg } from '../../public/js/ui/itemIconSvg.js';

describe('itemIconSvg (client)', () => {
  it('buildItemIconSvg returns svg for template keys', () => {
    const svg = buildItemIconSvg('rusty_sword');
    assert.ok(svg.includes('<svg'));
    assert.ok(svg.includes('item-icon-svg'));
  });

  it('buildItemIconSvg falls back for unknown type', () => {
    const svg = buildItemIconSvg('unknown');
    assert.ok(svg.includes('<svg'));
  });

  it('buildItemIconSvg includes shapes for potions', () => {
    assert.ok(buildItemIconSvg('health_potion').includes('<path'));
    assert.ok(buildItemIconSvg('mana_potion').includes('<path'));
  });

  it('potion icons use red and light blue fills', () => {
    assert.ok(buildItemIconSvg('health_potion').includes('#e74c3c'));
    assert.ok(buildItemIconSvg('mana_potion').includes('#87ceeb'));
  });
});
