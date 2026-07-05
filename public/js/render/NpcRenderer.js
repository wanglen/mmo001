import { NPC_ROLE } from '/shared/npcs.js';

const ROLE_COLORS = {
  [NPC_ROLE.INNKEEPER]: { robe: '#6a4a8a', skin: '#e8c4a0', hair: '#3a2818' },
  [NPC_ROLE.GUIDE]: { robe: '#3a6a4a', skin: '#d8b890', hair: '#5a4030' },
};

export class NpcRenderer {
  draw(ctx, npcs, camera) {
    if (!npcs?.length) return;

    const zoom = camera.zoom ?? 1;
    for (const npc of npcs) {
      this.drawNpc(ctx, npc, camera, zoom);
    }
  }

  drawNpc(ctx, npc, camera, zoom) {
    const screen = camera.worldToScreen(npc.x, npc.y);
    const w = 18 * zoom;
    const h = 24 * zoom;
    const x = screen.x - w / 2;
    const y = screen.y - h / 2;
    const colors = ROLE_COLORS[npc.role] ?? ROLE_COLORS[NPC_ROLE.GUIDE];

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(screen.x, screen.y + h * 0.42, w * 0.55, h * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = colors.robe;
    ctx.fillRect(x + w * 0.2, y + h * 0.45, w * 0.6, h * 0.45);

    ctx.fillStyle = colors.skin;
    ctx.fillRect(x + w * 0.3, y + h * 0.18, w * 0.4, h * 0.28);

    ctx.fillStyle = colors.hair;
    ctx.fillRect(x + w * 0.28, y + h * 0.12, w * 0.44, h * 0.12);

    const label = npc.name ?? 'NPC';
    ctx.font = `${Math.max(10, 11 * zoom)}px system-ui, sans-serif`;
    const textWidth = ctx.measureText(label).width;
    const pad = 4 * zoom;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(screen.x - textWidth / 2 - pad, y - 14 * zoom, textWidth + pad * 2, 12 * zoom);
    ctx.fillStyle = '#f0e6d2';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, screen.x, y - 8 * zoom);
  }
}
