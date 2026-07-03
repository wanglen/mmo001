/** Camera math shared for testing and client use. */

export const CAMERA_LERP = 0.12;
export const CAMERA_MIN_ZOOM = 0.6;
export const CAMERA_MAX_ZOOM = 1.8;
export const CAMERA_ZOOM_STEP = 0.1;
export const CAMERA_Y_SCALE = 0.55;

export const DEFAULT_CAMERA = {
  lerp: CAMERA_LERP,
  minZoom: CAMERA_MIN_ZOOM,
  maxZoom: CAMERA_MAX_ZOOM,
  yScale: CAMERA_Y_SCALE,
};

export function clampZoom(zoom, min = DEFAULT_CAMERA.minZoom, max = DEFAULT_CAMERA.maxZoom) {
  return Math.min(max, Math.max(min, zoom));
}

export function lerpView(current, target, factor = DEFAULT_CAMERA.lerp) {
  return current + (target - current) * factor;
}

export function worldToScreen(
  worldX,
  worldY,
  viewX,
  viewY,
  zoom,
  yScale,
  canvasWidth,
  canvasHeight
) {
  return {
    x: (worldX - viewX) * zoom + canvasWidth / 2,
    y: (worldY - viewY) * zoom * yScale + canvasHeight / 2,
  };
}

export function screenToWorld(
  screenX,
  screenY,
  viewX,
  viewY,
  zoom,
  yScale,
  canvasWidth,
  canvasHeight
) {
  return {
    x: (screenX - canvasWidth / 2) / zoom + viewX,
    y: (screenY - canvasHeight / 2) / (zoom * yScale) + viewY,
  };
}

export function getScaledTileSize(tileSize, zoom, yScale) {
  return {
    width: tileSize * zoom,
    height: tileSize * zoom * yScale,
  };
}
