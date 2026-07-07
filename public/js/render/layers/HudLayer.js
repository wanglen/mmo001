import { getZoneAtPixel } from '/shared/zones.js';

/** @param {import('../../ui/PlayerHud.js').PlayerHud} playerHud */
export function createHudLayer(playerHud) {
  return {
    id: 'hud',
    order: 200,
    draw(ctx, frame, _camera, canvas) {
      const zone = frame.map ? getZoneAtPixel(frame.map, frame.displayPlayer.x, frame.displayPlayer.y) : null;
      playerHud.draw(
        ctx,
        frame.displayPlayer,
        zone,
        frame.map,
        canvas.width,
        canvas.height,
        frame.version
      );
    },
  };
}
