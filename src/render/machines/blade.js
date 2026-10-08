import { C, ctx } from '../canvas.js';
import { S } from '../../core/state.js';
import { machineOn } from '../prims.js';

export function draw(b, r) {
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const L = Math.min(r.w, r.h) * 0.36;
  const on = machineOn(b);
  const a = S.running && on ? Math.sin(S.t * 8) * 0.25 : 0.2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = C.bright;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-L * Math.cos(a), -L * Math.sin(a) - L * 0.5);
  ctx.lineTo(L * Math.cos(a), L * Math.sin(a) + L * 0.5);
  ctx.moveTo(-L * Math.cos(a), -L * Math.sin(a) + L * 0.5);
  ctx.lineTo(L * Math.cos(a), L * Math.sin(a) - L * 0.5);
  ctx.stroke();
  ctx.restore();
}
