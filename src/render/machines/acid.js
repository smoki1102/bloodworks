import { C, ctx } from '../canvas.js';
import { rgba } from '../../config/palette.js';
import { S } from '../../core/state.js';
import { bar, queuedItems } from '../prims.js';

export function draw(b, r) {
  const lvl = r.y + r.h * 0.5;
  ctx.fillStyle = rgba(C.acid, 0.55);
  ctx.beginPath();
  ctx.moveTo(r.x + 7, r.y + r.h - 4);
  ctx.lineTo(r.x + 7, lvl);
  for (let i = 0; i <= r.w - 14; i += 8)
    ctx.lineTo(r.x + 7 + i, lvl + Math.sin(S.t * 3.2 + i * 0.13) * 2.6);
  ctx.lineTo(r.x + r.w - 7, r.y + r.h - 4);
  ctx.fill();
  queuedItems(r, b, 4, 20);
  ctx.strokeStyle = C.steel;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(r.x + 5, r.y + 13, r.w - 10, r.h - 17);
  bar(r.x + 8, r.y - 8, r.w - 16, (b.prog || 0) / 1.7, C.ok);
}
