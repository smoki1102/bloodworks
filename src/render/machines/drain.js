import { C, ctx } from '../canvas.js';
import { rgba } from '../../config/palette.js';

export function draw(b, r) {
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  ctx.fillStyle = rgba(C.glass, 0.4);
  ctx.fillRect(r.x + 8, r.y + 8, r.w - 16, r.h - 16);
  ctx.strokeStyle = C.steel;
  ctx.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(r.x + 12, r.y + 14 + i * 7);
    ctx.lineTo(r.x + r.w - 12, r.y + 14 + i * 7);
    ctx.stroke();
  }
  if (b.glow > 0.05) {
    ctx.fillStyle = rgba(C.glow, b.glow * 0.7);
    ctx.beginPath();
    ctx.arc(cx, cy, 8 + b.glow * 4, 0, 7);
    ctx.fill();
  }
}
