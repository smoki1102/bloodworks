import { BELT_SPEED, CELL, DX, DY, isDiag } from '../config/constants.js';
import { C, ctx } from './canvas.js';
import { rgba } from '../config/palette.js';
import { reducedMotion } from '../core/effects.js';
import { S } from '../core/state.js';
import { bldRect } from '../core/grid.js';

/** Bandpfeile scrollen nur ohne reduzierte Bewegung. */
const beltTime = () => (reducedMotion() ? 0 : S.t);

/* ------------------------------ Band & Gerüst ------------------------------ */

export const bandRect = (b) => {
  const r = bldRect(b);
  const vert = b.dir & 1;
  if (vert) return { x: r.x + r.w / 2 - 9, y: r.y, w: 18, h: r.h, vert: true };
  return { x: r.x, y: r.y + r.h / 2 - 9, w: r.w, h: 18, vert: false };
};

export function drawBandStrip(b, inner) {
  if (isDiag(b.dir)) return drawBandDiag(b, inner);
  const s = bandRect(b);
  ctx.fillStyle = C.dark;
  ctx.fillRect(s.x, s.y, s.w, s.h);
  ctx.fillStyle = C.body;
  ctx.fillRect(s.x + 1.5, s.y + 1.5, s.w - 3, s.h - 3);
  ctx.strokeStyle = C.light;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  const off = ((beltTime() * BELT_SPEED) % 20) - 20;
  if (s.vert) {
    for (let i = -1; i < s.h / 20 + 1; i++) {
      const py = s.y + i * 20 - off * ((b.dir === 3 ? -1 : 1) || 1);
      if (py < s.y + 2 || py > s.y + s.h - 4) continue;
      ctx.moveTo(s.x + 3, py);
      ctx.lineTo(s.x + 9, py + 5);
      ctx.lineTo(s.x + 15, py);
    }
  } else {
    const dir = b.dir === 2 ? -1 : 1;
    for (let i = -1; i < s.w / 20 + 1; i++) {
      const px = s.x + i * 20 * dir - off * dir;
      if (px < s.x + 2 || px > s.x + s.w - 4) continue;
      ctx.moveTo(px, s.y + 3);
      ctx.lineTo(px + 5 * dir, s.y + 9);
      ctx.lineTo(px, s.y + 15);
    }
  }
  ctx.stroke();
  if (inner) {
    ctx.fillStyle = rgba(C.beltInner, 0.35);
    ctx.fillRect(s.x, s.y, s.w, s.h);
  }
  if (b.dirt > 4) {
    ctx.fillStyle = rgba(C.beltDirt, Math.min(0.4, b.dirt / 260));
    ctx.fillRect(s.x, s.y, s.w, s.h);
  }
  if (b.on === false) {
    ctx.fillStyle = rgba(C.beltOff, 0.45);
    ctx.fillRect(s.x, s.y, s.w, s.h);
  }
}

/** Diagonales Band: gestreckter Streifen (Ecke zu Ecke), per 45°/135° gedreht. */
export function drawBandDiag(b, inner) {
  const r = bldRect(b);
  const cx = r.x + r.w / 2,
    cy = r.y + r.h / 2;
  const len = CELL * Math.SQRT2;
  const w = 18;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.atan2(DY[b.dir], DX[b.dir]));
  ctx.fillStyle = C.dark;
  ctx.fillRect(-len / 2, -w / 2, len, w);
  ctx.fillStyle = C.body;
  ctx.fillRect(-len / 2 + 1.5, -w / 2 + 1.5, len - 3, w - 3);
  ctx.strokeStyle = C.light;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  const off = ((beltTime() * BELT_SPEED) % 20) - 20;
  for (let i = -1; i < len / 20 + 1; i++) {
    const px = i * 20 - off;
    if (px < -len / 2 + 2 || px > len / 2 - 4) continue;
    ctx.moveTo(px, -6);
    ctx.lineTo(px + 5, 0);
    ctx.lineTo(px, 6);
  }
  ctx.stroke();
  if (inner) {
    ctx.fillStyle = rgba(C.beltInner, 0.35);
    ctx.fillRect(-len / 2, -w / 2, len, w);
  }
  if (b.dirt > 4) {
    ctx.fillStyle = rgba(C.beltDirt, Math.min(0.4, b.dirt / 260));
    ctx.fillRect(-len / 2, -w / 2, len, w);
  }
  if (b.on === false) {
    ctx.fillStyle = rgba(C.beltOff, 0.45);
    ctx.fillRect(-len / 2, -w / 2, len, w);
  }
  ctx.restore();
}
