import { C, ctx } from '../canvas.js';
import { rgba } from '../../config/palette.js';
import { bloodColor } from '../../core/effects.js';
import { clamp } from '../../utils/helpers.js';
import { S, nets } from '../../core/state.js';

export function draw(b, r) {
  const net = b.netId >= 0 ? nets[b.netId] : null;
  const v = net ? net.v : S.blood;
  const cap = net ? net.cap : S.bloodCap;
  const fh = (r.h - 26) * clamp(v / Math.max(1, cap), 0, 1);
  ctx.fillStyle = rgba(C.glass, 0.28);
  ctx.fillRect(r.x + 11, r.y + 15, r.w - 22, r.h - 22);
  ctx.fillStyle = bloodColor();
  ctx.fillRect(r.x + 11, r.y + r.h - 7 - fh, r.w - 22, fh);
  ctx.strokeStyle = C.steel;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(r.x + 11, r.y + 15, r.w - 22, r.h - 22);
}
