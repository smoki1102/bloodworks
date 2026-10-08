import { C, ctx } from '../canvas.js';
import { S } from '../../core/state.js';
import { machineOn } from '../prims.js';
import { moving, pose } from '../anim/poses.js';

export function draw(b, r) {
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const L = Math.min(r.w, r.h) * 0.36;
  const on = machineOn(b);
  const a = pose('blade', S.t, { still: !moving(S.running, on) }).angle;
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
