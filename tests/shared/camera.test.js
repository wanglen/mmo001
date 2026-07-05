import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  clampZoom,
  lerpView,
  worldToScreen,
  screenToWorld,
  getScaledTileSize,
  CAMERA_MIN_ZOOM,
  CAMERA_MAX_ZOOM,
  CAMERA_DEFAULT_ZOOM,
  clampViewToMap,
} from '../../shared/camera.js';

describe('camera', () => {
  it('clampZoom keeps zoom within bounds', () => {
    assert.equal(clampZoom(1), 1);
    assert.equal(clampZoom(0.1), CAMERA_MIN_ZOOM);
    assert.equal(clampZoom(5), CAMERA_MAX_ZOOM);
  });

  it('CAMERA_DEFAULT_ZOOM is within clamp bounds', () => {
    assert.equal(clampZoom(CAMERA_DEFAULT_ZOOM), CAMERA_DEFAULT_ZOOM);
  });

  it('lerpView moves toward target', () => {
    const next = lerpView(0, 100, 0.5);
    assert.equal(next, 50);
  });

  it('worldToScreen and screenToWorld are inverse operations', () => {
    const viewX = 200;
    const viewY = 150;
    const zoom = 1.2;
    const yScale = 0.55;
    const canvasWidth = 800;
    const canvasHeight = 600;
    const world = { x: 320, y: 240 };

    const screen = worldToScreen(
      world.x,
      world.y,
      viewX,
      viewY,
      zoom,
      yScale,
      canvasWidth,
      canvasHeight
    );
    const back = screenToWorld(
      screen.x,
      screen.y,
      viewX,
      viewY,
      zoom,
      yScale,
      canvasWidth,
      canvasHeight
    );

    assert.ok(Math.abs(back.x - world.x) < 0.001);
    assert.ok(Math.abs(back.y - world.y) < 0.001);
  });

  it('getScaledTileSize applies zoom and yScale', () => {
    const size = getScaledTileSize(32, 2, 0.5);
    assert.deepEqual(size, { width: 64, height: 32 });
  });

  it('clampViewToMap keeps camera inside bounds', () => {
    const bounds = { minX: 100, minY: 100, maxX: 900, maxY: 700 };
    const clamped = clampViewToMap(50, 50, bounds, 1, 0.55, 800, 600);
    assert.ok(clamped.x >= bounds.minX);
    assert.ok(clamped.y >= bounds.minY);
  });

  it('clampViewToMap returns input when bounds are null', () => {
    const result = clampViewToMap(120, 80, null, 1, 0.55, 800, 600);
    assert.equal(result.x, 120);
    assert.equal(result.y, 80);
  });
});
