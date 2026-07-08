import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeHudLayout,
  orbStackHeightBelowCenter,
  xpBarTopFromBottom,
} from '../../shared/hudLayout.js';

describe('hudLayout', () => {
  it('orbStackHeightBelowCenter includes orb label', () => {
    assert.equal(orbStackHeightBelowCenter(34), 34 + 12 + 9);
  });

  it('xpBarTopFromBottom clears the skill bar band', () => {
    const layout = computeHudLayout(1280, 720);
    assert.ok(layout.xpBarTopFromBottom > layout.skillBarTopFromBottom);
    assert.equal(layout.xpBarTopFromBottom, xpBarTopFromBottom(layout.skillBarTopFromBottom));
  });

  it('recall hint sits above the XP strip', () => {
    const layout = computeHudLayout(1280, 720);
    const xpBlockTop =
      layout.xpBarTopFromBottom + layout.xpBarHeight + layout.xpTextHeight;
    assert.ok(layout.recallHintBottomFromBottom > xpBlockTop);
  });

  it('computeHudLayout keeps chat above the resource band', () => {
    const layout = computeHudLayout(1280, 720);

    const resourceLowest =
      layout.orbCenterFromBottom +
      orbStackHeightBelowCenter(layout.orbRadius, { orbLabelOffset: layout.orbLabelOffset });
    const hudBandTop = Math.max(resourceLowest, layout.recallHintBottomFromBottom) + 12;

    assert.ok(layout.chatBottom > hudBandTop);
  });

  it('computeHudLayout narrows chat on compact viewports', () => {
    const desktop = computeHudLayout(1280, 720);
    const compact = computeHudLayout(800, 600);

    assert.ok(compact.chatWidth <= desktop.chatWidth);
    assert.ok(compact.orbRadius <= desktop.orbRadius);
  });
});
