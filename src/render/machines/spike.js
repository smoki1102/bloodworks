import { C, ctx } from '../canvas.js';
import { S } from '../../core/state.js';
import { machineOn } from '../prims.js';

export function draw(b, r) {
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const rad = Math.min(r.w, r.h) / 2 - 10;
  const on = machineOn(b);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(S.running && on ? S.t * 3 : 0);
  ctx.fillStyle = C.bright;
  ctx.beginPath();
  const teeth = 32;
  for (let i = 0; i < teeth; i++) {
    const a = (i * Math.PI) / (teeth / 2);
    const rr = i % 2 ? rad * 0.6 : rad;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = C.accent2;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, rad * 0.38, 0, 7);
  ctx.stroke();
  ctx.restore();
}
