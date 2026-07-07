import {
  clampZoom,
  lerpView,
  worldToScreen as toScreen,
  screenToWorld as toWorld,
  getScaledTileSize,
  clampViewToMap,
  DEFAULT_CAMERA,
  CAMERA_DEFAULT_ZOOM,
} from '../../shared/camera.js';
import {
  CAMERA_LERP,
  CAMERA_MIN_ZOOM,
  CAMERA_MAX_ZOOM,
  CAMERA_Y_SCALE,
} from '../config.js';

export class Camera {
  constructor(canvas) {
    this.canvas = canvas;
    this.viewX = 0;
    this.viewY = 0;
    this.zoom = CAMERA_DEFAULT_ZOOM;
    this.yScale = CAMERA_Y_SCALE;
    this.lerp = CAMERA_LERP;
    this.initialized = false;
    this.mapBounds = null;
  }

  setMapBounds(mapWidth, mapHeight, tileSize) {
    const pad = tileSize * 1.5;
    this.mapBounds = {
      minX: pad,
      minY: pad,
      maxX: mapWidth * tileSize - pad,
      maxY: mapHeight * tileSize - pad,
    };
  }

  follow(targetX, targetY) {
    if (!this.initialized) {
      const clamped = clampViewToMap(
        targetX,
        targetY,
        this.mapBounds,
        this.zoom,
        this.yScale,
        this.canvas.width,
        this.canvas.height
      );
      this.viewX = clamped.x;
      this.viewY = clamped.y;
      this.initialized = true;
      return;
    }

    const nextX = lerpView(this.viewX, targetX, this.lerp);
    const nextY = lerpView(this.viewY, targetY, this.lerp);
    const clamped = clampViewToMap(
      nextX,
      nextY,
      this.mapBounds,
      this.zoom,
      this.yScale,
      this.canvas.width,
      this.canvas.height
    );
    this.viewX = clamped.x;
    this.viewY = clamped.y;
  }

  adjustZoom(delta) {
    this.zoom = clampZoom(this.zoom + delta, CAMERA_MIN_ZOOM, CAMERA_MAX_ZOOM);
  }

  getScaledTileSize(tileSize) {
    return getScaledTileSize(tileSize, this.zoom, this.yScale);
  }

  /** Visible world bounds for tile culling. */
  getViewBounds() {
    const { width, height } = this.canvas;
    const topLeft = this.screenToWorld(0, 0);
    const bottomRight = this.screenToWorld(width, height);

    return {
      minX: Math.min(topLeft.x, bottomRight.x),
      minY: Math.min(topLeft.y, bottomRight.y),
      maxX: Math.max(topLeft.x, bottomRight.x),
      maxY: Math.max(topLeft.y, bottomRight.y),
    };
  }

  worldToScreen(worldX, worldY) {
    return toScreen(
      worldX,
      worldY,
      this.viewX,
      this.viewY,
      this.zoom,
      this.yScale,
      this.canvas.width,
      this.canvas.height
    );
  }

  screenToWorld(screenX, screenY) {
    return toWorld(
      screenX,
      screenY,
      this.viewX,
      this.viewY,
      this.zoom,
      this.yScale,
      this.canvas.width,
      this.canvas.height
    );
  }
}

export { DEFAULT_CAMERA };
