import { C, ctx } from './canvas.js';
import { rgba } from '../config/palette.js';
import { bloodColor } from '../core/effects.js';
import { clamp } from '../utils/helpers.js';

/* ------------------------------- Figuren ------------------------------- */

export function drawCorpseShape(x, y, rot, alpha, missing, part) {
  const miss = (p) => (missing ? missing.indexOf(p) >= 0 : false);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot * 0.12);
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = C.dim;
  ctx.fillStyle = C.dim;
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  if (part && part !== 'torso' && part !== 'head') {
    drawLimbShape(part, 0, 0);
    ctx.restore();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(-11, 0);
  ctx.lineTo(9, 0);
  if (!miss('legL')) {
    ctx.moveTo(-11, 0);
    ctx.lineTo(-19, -5);
  }
  if (!miss('legR')) {
    ctx.moveTo(-11, 0);
    ctx.lineTo(-19, 5);
  }
  if (!miss('armL')) {
    ctx.moveTo(4, 0);
    ctx.lineTo(0, -8);
  }
  if (!miss('armR')) {
    ctx.moveTo(4, 0);
    ctx.lineTo(0, 8);
  }
  ctx.stroke();
  if (!miss('head')) {
    ctx.beginPath();
    ctx.arc(13, -1, 5.4, 0, 7);
    ctx.fill();
  }
  ctx.restore();
}

export function drawLimbShape(part, x, y) {
  ctx.beginPath();
  if (part === 'legL' || part === 'legR') {
    ctx.moveTo(x, y);
    ctx.lineTo(x - 9, y - 3);
    ctx.lineTo(x - 13, y + 2);
  } else if (part === 'head') {
    ctx.arc(x, y, 5.4, 0, 7);
    ctx.fill();
    return;
  } else {
    ctx.moveTo(x, y);
    ctx.lineTo(x - 7, y - 4);
    ctx.lineTo(x - 11, y + 1);
  }
  ctx.stroke();
}

/** Stick an (x,y) – Füße auf y, Seite von rechts. */
export function drawStickFigure(x, y, body, anim, glow, chair) {
  const has = (p) => !body || body.limbs[p];
  const ink = glow ? rgba(C.white, 0.92) : C.bright;
  const sw = Math.sin(anim * 13) * (body && body.hp < 45 ? 6.5 : 4);
  ctx.save();
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineWidth = glow ? 7.2 : 2.6;
  ctx.lineCap = 'round';
  if (chair) {
    ctx.strokeStyle = glow ? rgba(C.white, 0.8) : C.steel;
    ctx.lineWidth = glow ? 5 : 2.2;
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 34);
    ctx.lineTo(x - 8, y - 12);
    ctx.lineTo(x - 11, y - 1);
    ctx.moveTo(x - 13, y - 1);
    ctx.lineTo(x - 3, y - 1);
    ctx.moveTo(x - 8, y - 17);
    ctx.lineTo(x + 6, y - 17);
    ctx.stroke();
    ctx.strokeStyle = ink;
    ctx.fillStyle = ink;
    ctx.lineWidth = glow ? 7.2 : 2.6;
    ctx.beginPath();
    ctx.moveTo(x, y - 14);
    ctx.lineTo(x + 1, y - 36);
    ctx.moveTo(x, y - 14);
    ctx.lineTo(x + 9, y - 14);
    ctx.lineTo(x + 10, y - 2);
    if (has('armL') || has('armR')) {
      ctx.moveTo(x + 1, y - 33);
      ctx.lineTo(x + 7, y - 26);
      ctx.lineTo(x + 11, y - 17);
    }
    ctx.stroke();
    if (has('head')) {
      ctx.beginPath();
      ctx.arc(x + 2, y - 42, glow ? 7.4 : 5.2, 0, 7);
      ctx.fill();
    }
    ctx.restore();
    return;
  }
  ctx.beginPath();
  if (has('legL')) {
    ctx.moveTo(x, y - 11);
    ctx.lineTo(x - 5 + sw * 0.7, y);
  } else {
    ctx.moveTo(x, y - 11);
    ctx.lineTo(x - 4, y - 5);
  }
  if (has('legR')) {
    ctx.moveTo(x, y - 11);
    ctx.lineTo(x + 5 - sw * 0.7, y);
  } else {
    ctx.moveTo(x, y - 11);
    ctx.lineTo(x + 4, y - 5);
  }
  ctx.moveTo(x, y - 22);
  ctx.lineTo(x, y - 11);
  if (has('armL')) {
    ctx.moveTo(x, y - 19);
    ctx.lineTo(x - 7, y - 13 + sw);
  } else {
    ctx.moveTo(x, y - 19);
    ctx.lineTo(x - 5, y - 17);
  }
  if (has('armR')) {
    ctx.moveTo(x, y - 19);
    ctx.lineTo(x + 7, y - 13 - sw);
  } else {
    ctx.moveTo(x, y - 19);
    ctx.lineTo(x + 5, y - 17);
  }
  ctx.stroke();
  if (has('head')) {
    ctx.beginPath();
    ctx.arc(x, y - 27, glow ? 7.4 : 5.2, 0, 7);
    ctx.fill();
  }
  if (!glow && body && body.bleeding > 0) {
    ctx.fillStyle = bloodColor();
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(x - 3, y - 1, 1.8, 0, 7);
    ctx.arc(x + 4, y - 3, 1.4, 0, 7);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

export function drawCorpse(c) {
  const air = c.state === 'fall';
  ctx.save();
  ctx.translate(c.x, c.y - (air ? 12 : 4));
  if (air) ctx.rotate(c.rot);
  if (c.kind === 'limb') {
    ctx.globalAlpha = clamp(c.life / 12, 0, 1);
    ctx.strokeStyle = C.dim;
    ctx.fillStyle = C.dim;
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    drawLimbShape(c.part || 'armL', 0, 0);
    ctx.globalAlpha = 1;
  } else drawCorpseShape(0, 0, 0, clamp(c.life / 12, 0, 1), c.missing);
  ctx.restore();
}

/** Ein Item (Leiche oder Gliedmaße) als ruhende Zeichnung an (x,y). */
export function drawItemShape(it, x, y) {
  ctx.save();
  ctx.translate(x, y - 6);
  ctx.rotate((it.rot || 0) * 0.4);
  if (it.kind === 'limb') {
    ctx.strokeStyle = C.dim;
    ctx.fillStyle = C.dim;
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    drawLimbShape(it.part || 'armL', 0, 0);
  } else drawCorpseShape(0, 0, 0, 1, it.missing);
  ctx.restore();
}
