import { C, ctx } from '../canvas.js';
import { DEF } from '../../config/building-defs.js';
import { drawIcon } from '../icons.js';
import { machineOn } from '../prims.js';

export function draw(b, r) {
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const on = machineOn(b);
  drawIcon(ctx, DEF[b.t].icon, cx, cy, 20, on ? C.bright : C.steel);
  for (let i = 0; i < b.items.length; i++) {
    ctx.fillStyle = C.accent2;
    ctx.beginPath();
    ctx.arc(r.x + 7 + i * 9, r.y + r.h - 7, 3, 0, 7);
    ctx.fill();
  }
}
