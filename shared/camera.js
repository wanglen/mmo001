/** Camera math shared for testing and client use. */

export const CAMERA_LERP = 0.12;
export const CAMERA_DEFAULT_ZOOM = 1.6;
export const CAMERA_MIN_ZOOM = 0.7;
export const CAMERA_MAX_ZOOM = 2.4;
export const CAMERA_ZOOM_STEP = 0.1;
export const CAMERA_Y_SCALE = 0.55;

export const DEFAULT_CAMERA = {
  lerp: CAMERA_LERP,
  defaultZoom: CAMERA_DEFAULT_ZOOM,
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

/**
 * Keep camera center inside map bounds so the view does not drift into empty void.
 * @param {{ minX: number, minY: number, maxX: number, maxY: number } | null} bounds
 */
export function clampViewToMap(
  viewX,
  viewY,
  bounds,
  zoom,
  yScale,
  canvasWidth,
  canvasHeight
) {
  if (!bounds) return { x: viewX, y: viewY };

  const halfW = canvasWidth / (2 * zoom);
  const halfH = canvasHeight / (2 * zoom * yScale);
  const spanX = bounds.maxX - bounds.minX;
  const spanY = bounds.maxY - bounds.minY;

  if (spanX <= halfW * 2) {
    viewX = (bounds.minX + bounds.maxX) / 2;
  } else {
    viewX = Math.min(bounds.maxX - halfW, Math.max(bounds.minX + halfW, viewX));
  }

  if (spanY <= halfH * 2) {
    viewY = (bounds.minY + bounds.maxY) / 2;
  } else {
    viewY = Math.min(bounds.maxY - halfH, Math.max(bounds.minY + halfH, viewY));
  }

  return { x: viewX, y: viewY };
}
