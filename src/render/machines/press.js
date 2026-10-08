import { C, ctx } from '../canvas.js';
import { machineOn } from '../prims.js';

export function draw(b, r) {
  const cx = r.x + r.w / 2;
  const top = r.y + 14;
  const bottom = r.y + r.h - 8;
  const on = machineOn(b);
  const ph = (b.items[0]?.prog || 0) % 1.4;
  const down = on ? (ph < 0.5 ? ph : Math.max(0, 1 - (ph - 0.5) / 0.9)) : 0.15;
  const plateY = r.y + 30 + down * Math.max(0, bottom - r.y - 52);
  ctx.fillStyle = C.dark;
  ctx.fillRect(r.x + 6, top, 6, bottom - top);
  ctx.fillRect(r.x + r.w - 12, top, 6, bottom - top);
  ctx.fillStyle = C.light;
  ctx.fillRect(cx - 5, top, 10, Math.max(0, plateY - top));
  ctx.fillStyle = C.accent;
  ctx.fillRect(r.x + 12, plateY, r.w - 24, 14);
  ctx.fillStyle = C.accent2;
  ctx.fillRect(r.x + 12, plateY, r.w - 24, 3);
}
