import { C, ctx } from '../canvas.js';
import { DEF } from '../../config/building-defs.js';
import { drawIcon } from '../icons.js';
import { machineOn } from '../prims.js';

export function draw(b, r) {
  const on = machineOn(b);
  const size = Math.min(r.w, r.h) * 0.62;
  drawIcon(ctx, DEF[b.t].icon, r.x + r.w / 2, r.y + r.h / 2, size, on && b.link === 'ok' ? C.bright : C.steel);
  if (b.reserveTouched) {
    ctx.fillStyle = C.accent2;
    ctx.fillRect(r.x + 5, r.y + 15, 5, r.h - 22);
  }
}
