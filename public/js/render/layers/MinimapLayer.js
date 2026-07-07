/** @param {import('../../ui/Minimap.js').Minimap} minimap */
export function createMinimapLayer(minimap) {
  return {
    id: 'minimap',
    order: 190,
    draw(ctx, frame, _camera, canvas) {
      minimap.draw(ctx, frame.map, frame.displayPlayer, frame.fogOfWar, canvas.width);
    },
  };
}
