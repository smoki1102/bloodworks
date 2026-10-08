import { C, ctx } from '../canvas.js';
import { S } from '../../core/state.js';
import { machineOn } from '../prims.js';

export function draw(b, r) {
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const rad = Math.min(r.w, r.h) / 2 - 8;
  const on = machineOn(b);
  const a = S.running && on ? S.t * 7 : 0.6;
  ctx.strokeStyle = C.light;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(cx - Math.cos(a) * rad, cy - Math.sin(a) * rad);
  ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
  ctx.stroke();
  ctx.fillStyle = C.accent2;
  ctx.beginPath();
  ctx.arc(cx, cy, 7, 0, 7);
  ctx.fill();
}
