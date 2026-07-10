import { NPC_ROLE } from '/shared/npcs.js';

const ROLE_COLORS = {
  [NPC_ROLE.INNKEEPER]: { robe: '#6a4a8a', skin: '#e8c4a0', hair: '#3a2818' },
  [NPC_ROLE.GUIDE]: { robe: '#3a6a4a', skin: '#d8b890', hair: '#5a4030' },
};

export class NpcRenderer {
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {object[]} npcs
   * @param {object} camera
   * @param {{ thinkingNpcId?: string | null, rafTimestamp?: number }} [options]
   */
  draw(ctx, npcs, camera, options = {}) {
    if (!npcs?.length) return;

    const zoom = camera.zoom ?? 1;
    const thinkingNpcId = options.thinkingNpcId ?? null;
    const rafTimestamp = options.rafTimestamp ?? 0;
    for (const npc of npcs) {
      this.drawNpc(ctx, npc, camera, zoom, {
        thinking: thinkingNpcId != null && npc.id === thinkingNpcId,
        rafTimestamp,
      });
    }
  }

  drawNpc(ctx, npc, camera, zoom, { thinking = false, rafTimestamp = 0 } = {}) {
    const screen = camera.worldToScreen(npc.x, npc.y);
    const w = 18 * zoom;
    const h = 24 * zoom;
    const bob = thinking ? Math.sin(rafTimestamp / 180) * 2.2 * zoom : 0;
    const sway = thinking ? Math.sin(rafTimestamp / 260) * 1.2 * zoom : 0;
    const x = screen.x - w / 2 + sway;
    const y = screen.y - h / 2 + bob;
    const colors = ROLE_COLORS[npc.role] ?? ROLE_COLORS[NPC_ROLE.GUIDE];

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(screen.x, screen.y + h * 0.42, w * 0.55, h * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    if (thinking) {
      const pulse = 0.25 + (Math.sin(rafTimestamp / 220) + 1) * 0.12;
      ctx.fillStyle = `rgba(135, 206, 235, ${pulse})`;
      ctx.beginPath();
      ctx.ellipse(screen.x + sway, screen.y + bob, w * 0.85, h * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = colors.robe;
    ctx.fillRect(x + w * 0.2, y + h * 0.45, w * 0.6, h * 0.45);

    ctx.fillStyle = colors.skin;
    ctx.fillRect(x + w * 0.3, y + h * 0.18, w * 0.4, h * 0.28);

    ctx.fillStyle = colors.hair;
    ctx.fillRect(x + w * 0.28, y + h * 0.12, w * 0.44, h * 0.12);

    // Hand-to-chin while pondering
    if (thinking) {
      ctx.fillStyle = colors.skin;
      ctx.fillRect(x + w * 0.62, y + h * 0.34, w * 0.16, h * 0.14);
    }

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

    if (thinking) {
      this.drawThoughtBubble(ctx, screen.x + sway, y - 18 * zoom, zoom, rafTimestamp);
    }
  }

  /**
   * Comic-style thought cloud with bouncing dots.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} anchorX
   * @param {number} anchorY top of nameplate
   * @param {number} zoom
   * @param {number} rafTimestamp
   */
  drawThoughtBubble(ctx, anchorX, anchorY, zoom, rafTimestamp) {
    const bubbleX = anchorX + 16 * zoom;
    const bubbleY = anchorY - 22 * zoom;
    const bw = 28 * zoom;
    const bh = 18 * zoom;

    ctx.fillStyle = 'rgba(240, 246, 255, 0.92)';
    ctx.strokeStyle = 'rgba(30, 60, 90, 0.55)';
    ctx.lineWidth = Math.max(1, zoom);

    // Trail puffs
    const puffs = [
      { x: anchorX + 4 * zoom, y: anchorY - 4 * zoom, r: 2.2 * zoom },
      { x: anchorX + 9 * zoom, y: anchorY - 10 * zoom, r: 3.2 * zoom },
      { x: anchorX + 13 * zoom, y: anchorY - 15 * zoom, r: 4 * zoom },
    ];
    for (const puff of puffs) {
      ctx.beginPath();
      ctx.arc(puff.x, puff.y, puff.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Main cloud (overlapping circles)
    const lobes = [
      { x: bubbleX - bw * 0.28, y: bubbleY, r: bh * 0.42 },
      { x: bubbleX, y: bubbleY - bh * 0.08, r: bh * 0.5 },
      { x: bubbleX + bw * 0.28, y: bubbleY, r: bh * 0.42 },
      { x: bubbleX, y: bubbleY + bh * 0.12, r: bh * 0.38 },
    ];
    ctx.beginPath();
    for (const lobe of lobes) {
      ctx.moveTo(lobe.x + lobe.r, lobe.y);
      ctx.arc(lobe.x, lobe.y, lobe.r, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.stroke();

    // Animated thinking dots
    const t = rafTimestamp / 1000;
    for (let i = 0; i < 3; i++) {
      const phase = (t * 2.2 + i * 0.35) % 1;
      const bounce = Math.sin(phase * Math.PI) * 2.5 * zoom;
      const dx = bubbleX + (i - 1) * 7 * zoom;
      const dy = bubbleY + bounce;
      const alpha = 0.35 + phase * 0.65;
      ctx.fillStyle = `rgba(40, 70, 110, ${alpha})`;
      ctx.beginPath();
      ctx.arc(dx, dy, 2.1 * zoom, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
