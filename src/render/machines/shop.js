import { C, ctx } from '../canvas.js';
import { DEF } from '../../config/building-defs.js';
import { drawIcon } from '../icons.js';
import { bar, machineOn, queuedItems } from '../prims.js';

export function draw(b, r) {
  const on = machineOn(b);
  drawIcon(ctx, DEF[b.t].icon, r.x + r.w / 2, r.y + r.h * 0.38, 34, on ? C.bright : C.steel);
  queuedItems(r, b, 3, 20);
  bar(r.x + 6, r.y - 8, r.w - 12, (b.prog || 0) / 0.9, C.ok);
}
