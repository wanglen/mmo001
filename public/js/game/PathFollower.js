import {
  findPath,
  findNearestWalkable,
  tileToWorldCenter,
  worldToTile,
} from '/shared/pathfinding.js';
import { directionFromDelta8 } from '/shared/movement.js';
import { TILE_SIZE } from '../config.js';

const WAYPOINT_THRESHOLD = 6;

export class PathFollower {
  constructor() {
    this.waypoints = [];
    this.target = null;
  }

  clear() {
    this.waypoints = [];
    this.target = null;
  }

  isActive() {
    return this.waypoints.length > 0;
  }

  setPath(map, playerX, playerY, worldX, worldY) {
    const startTile = worldToTile(playerX, playerY, TILE_SIZE);
    let endTile = worldToTile(worldX, worldY, TILE_SIZE);
    const nearest = findNearestWalkable(map, endTile.x, endTile.y);

    if (!nearest) {
      this.clear();
      return false;
    }

    endTile = nearest;
    const tilePath = findPath(map, startTile.x, startTile.y, endTile.x, endTile.y);

    if (tilePath.length === 0) {
      this.clear();
      return false;
    }

    this.waypoints = tilePath.map(({ x, y }) => tileToWorldCenter(x, y, TILE_SIZE));
    this.target = tileToWorldCenter(endTile.x, endTile.y, TILE_SIZE);
    return true;
  }

  getDirection(playerX, playerY) {
    if (this.waypoints.length === 0) return null;

    let waypoint = this.waypoints[0];
    let dx = waypoint.x - playerX;
    let dy = waypoint.y - playerY;
    let dist = Math.hypot(dx, dy);

    while (dist < WAYPOINT_THRESHOLD && this.waypoints.length > 0) {
      this.waypoints.shift();
      if (this.waypoints.length === 0) {
        this.target = null;
        return null;
      }
      waypoint = this.waypoints[0];
      dx = waypoint.x - playerX;
      dy = waypoint.y - playerY;
      dist = Math.hypot(dx, dy);
    }

    return directionFromDelta8(dx, dy);
  }
}
