import { C, ctx } from '../canvas.js';
import { DEF } from '../../config/building-defs.js';
import { drawIcon } from '../icons.js';
import { machineOn } from '../prims.js';

export function draw(b, r) {
  const on = machineOn(b);
  drawIcon(ctx, DEF[b.t].icon, r.x + r.w / 2, r.y + r.h / 2, 22, on ? C.accent2 : C.steel);
}
