import { C, ctx } from '../canvas.js';
import { DEF } from '../../config/building-defs.js';
import { drawIcon } from '../icons.js';

export function draw(b, r) {
  const size = Math.min(r.w, r.h) * 0.62;
  drawIcon(ctx, DEF[b.t].icon, r.x + r.w / 2, r.y + r.h / 2, size, b.glow > 0.05 ? C.warn : C.steel);
}
