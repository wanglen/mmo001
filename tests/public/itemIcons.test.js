import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveIconType, buildItemIconSvg } from '../../public/js/ui/itemIcons.js';

describe('itemIcons', () => {
  it('resolveIconType prefers item slot then type then fallback', () => {
    assert.equal(resolveIconType({ slot: 'ring', type: 'weapon' }), 'ring');
    assert.equal(resolveIconType({ type: 'helm' }), 'helm');
    assert.equal(resolveIconType(null, 'boots'), 'boots');
    assert.equal(resolveIconType(null), 'chest');
  });

  it('buildItemIconSvg returns svg for known types', () => {
    const svg = buildItemIconSvg('weapon');
    assert.ok(svg.includes('<svg'));
    assert.ok(svg.includes('item-icon-svg'));
  });

  it('buildItemIconSvg falls back for unknown type', () => {
    const svg = buildItemIconSvg('unknown');
    assert.ok(svg.includes('<svg'));
  });
});
