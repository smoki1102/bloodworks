import { C, ctx } from '../canvas.js';
import { rgba } from '../../config/palette.js';
import { S } from '../../core/state.js';

export function draw(b, r) {
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  ctx.fillStyle = rgba(C.spawnGlass, 0.12 + 0.08 * Math.sin(S.t * 3));
  ctx.fillRect(r.x + 8, r.y + 16, r.w - 16, r.h - 26);
  ctx.strokeStyle = C.steel;
  ctx.lineWidth = 2;
  ctx.strokeRect(r.x + 8, r.y + 16, r.w - 16, r.h - 26);
  ctx.fillStyle = C.bright;
  ctx.beginPath();
  const dx = [10, 0, -10, 0][b.dir ?? 0];
  const dy = [0, 10, 0, -10][b.dir ?? 0];
  ctx.moveTo(cx + dx, cy + dy);
  ctx.lineTo(cx + dy * 0.7 - dx * 0.4, cy - dx * 0.7 - dy * 0.4);
  ctx.lineTo(cx - dy * 0.7 - dx * 0.4, cy + dx * 0.7 - dy * 0.4);
  ctx.closePath();
  ctx.fill();
}
