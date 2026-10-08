import { C, ctx } from '../canvas.js';
import { rgba } from '../../config/palette.js';
import { S } from '../../core/state.js';
import { bar, queuedItems } from '../prims.js';

export function draw(b, r) {
  ctx.fillStyle = rgba(C.glass, 0.35);
  ctx.fillRect(r.x + 10, r.y + 16, r.w - 20, r.h - 26);
  if (b.items.length && b.clean <= 0) {
    ctx.fillStyle = rgba(C.fire, 0.5 + 0.25 * Math.sin(S.t * 9));
    ctx.fillRect(r.x + 14, r.y + 20, r.w - 28, r.h - 36);
  }
  queuedItems(r, b, 3, 18);
  bar(r.x + 8, r.y - 8, r.w - 16, (b.prog || 0) / 1.4, C.warn);
}
