import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createPortal,
  findPortalAt,
  isInPortalRange,
  portalPixelFromTile,
  PORTAL_USE_RANGE,
} from '../../shared/portals.js';
import { TILE_SIZE } from '../../shared/constants.js';

describe('portals', () => {
  it('createPortal converts tile to pixel center', () => {
    const portal = createPortal({
      id: 'test',
      label: 'Town',
      tile: { x: 4, y: 5 },
      targetMapId: 'town',
      targetTile: { x: 10, y: 10 },
    });

    const expected = portalPixelFromTile(4, 5);
    assert.equal(portal.x, expected.x);
    assert.equal(portal.y, expected.y);
    assert.equal(portal.label, 'Town');
  });

  it('isInPortalRange respects use range', () => {
    const portal = createPortal({
      id: 'p1',
      label: 'Wilderness',
      tile: { x: 0, y: 0 },
      targetMapId: 'wilderness',
      targetTile: { x: 1, y: 1 },
    });

    assert.ok(isInPortalRange(portal.x, portal.y, portal));
    assert.ok(isInPortalRange(portal.x + PORTAL_USE_RANGE, portal.y, portal));
    assert.ok(!isInPortalRange(portal.x + PORTAL_USE_RANGE + 1, portal.y, portal));
  });

  it('findPortalAt returns nearest portal within range', () => {
    const portals = [
      createPortal({
        id: 'far',
        label: 'Far',
        tile: { x: 20, y: 20 },
        targetMapId: 'dungeon',
        targetTile: { x: 0, y: 0 },
      }),
      createPortal({
        id: 'near',
        label: 'Near',
        tile: { x: 2, y: 2 },
        targetMapId: 'town',
        targetTile: { x: 0, y: 0 },
      }),
    ];

    const near = portals[1];
    const hit = findPortalAt(portals, near.x, near.y);
    assert.equal(hit?.id, 'near');

    const miss = findPortalAt(portals, 0, 0, TILE_SIZE);
    assert.equal(miss, null);
  });
});
