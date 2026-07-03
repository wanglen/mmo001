import {
  clampZoom,
  lerpView,
  worldToScreen as toScreen,
  screenToWorld as toWorld,
  getScaledTileSize,
  DEFAULT_CAMERA,
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
    this.zoom = 1;
    this.yScale = CAMERA_Y_SCALE;
    this.lerp = CAMERA_LERP;
    this.initialized = false;
  }

  follow(targetX, targetY) {
    if (!this.initialized) {
      this.viewX = targetX;
      this.viewY = targetY;
      this.initialized = true;
      return;
    }

    this.viewX = lerpView(this.viewX, targetX, this.lerp);
    this.viewY = lerpView(this.viewY, targetY, this.lerp);
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
