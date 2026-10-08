import { DEF } from '../config/building-defs.js';
import { BELT_SPEED, CELL, DX, DY, GRID_W, PH, PW, isDiag, opp } from '../config/constants.js';
import { bloodColor, reducedMotion } from '../core/effects.js';
import { edgePoint, itemPos } from '../core/belts.js';
import { planBeltPath } from '../core/belt-path.js';
import { costOf, originOf, placeReason } from '../core/placement.js';
import { bldAtCell, bldRect, viewCells } from '../core/grid.js';
import {
  S,
  beltBlood,
  blds,
  corpses,
  floorBlood,
  nets,
  parts,
  sticks,
} from '../core/state.js';
import { $, clamp } from '../utils/helpers.js';

export const cv = $('cv'),
  ctx = cv.getContext('2d');
export let vScale = 1,
  vOffX = 0,
  vOffY = 0,
  DPR = 1,
  vw = 1,
  vh = 1;

export const C = {
  bg: '#141a22',
  hall: '#1d242e',
  grid: 'rgba(120,140,165,.10)',
  grid2: 'rgba(120,140,165,.20)',
  body: '#d7dfe9',
  dark: '#2a333f',
  steel: '#7c8a9a',
  light: '#3c4a5a',
  bright: '#0f1720',
  dim: '#5d6b7a',
  accent: '#1d7fd6',
  accent2: '#2f81f8',
  err: '#e5483a',
  warn: '#e0a040',
  ok: '#2f9e44',
};

/* ------------------------------- Kamera ------------------------------- */

export function screenToWorld(sx, sy) {
  return { x: (sx - vw / 2) / S.cam.z + S.cam.x, y: (sy - vh / 2) / S.cam.z + S.cam.y };
}

export function centerCam(x, y, z) {
  S.cam.x = clamp(x, 0, PW);
  S.cam.y = clamp(y, 0, PH);
  if (z) S.cam.z = clamp(z, 0.3, 2.5);
}

export function zoomAt(sx, sy, f) {
  const before = screenToWorld(sx, sy);
  S.cam.z = clamp(S.cam.z * f, 0.3, 2.5);
  const after = screenToWorld(sx, sy);
  S.cam.x = clamp(S.cam.x + before.x - after.x, 0, PW);
  S.cam.y = clamp(S.cam.y + before.y - after.y, 0, PH);
}

export function panBy(dx, dy) {
  S.cam.x = clamp(S.cam.x - dx / S.cam.z, 0, PW);
  S.cam.y = clamp(S.cam.y - dy / S.cam.z, 0, PH);
}

const applyCam = () =>
  ctx.setTransform(
    DPR * S.cam.z,
    0,
    0,
    DPR * S.cam.z,
    DPR * (vw / 2 - S.cam.x * S.cam.z),
    DPR * (vh / 2 - S.cam.y * S.cam.z),
  );

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
  const ink = glow ? 'rgba(255,255,255,.92)' : C.bright;
  const sw = Math.sin(anim * 13) * (body && body.hp < 45 ? 6.5 : 4);
  ctx.save();
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineWidth = glow ? 7.2 : 2.6;
  ctx.lineCap = 'round';
  if (chair) {
    ctx.strokeStyle = glow ? 'rgba(255,255,255,.8)' : C.steel;
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

/* ------------------------------ Band & Gerüst ------------------------------ */

const bandRect = (b) => {
  const r = bldRect(b);
  const vert = b.dir & 1;
  if (vert) return { x: r.x + r.w / 2 - 9, y: r.y, w: 18, h: r.h, vert: true };
  return { x: r.x, y: r.y + r.h / 2 - 9, w: r.w, h: 18, vert: false };
};

function drawBandStrip(b, inner) {
  if (isDiag(b.dir)) return drawBandDiag(b, inner);
  const s = bandRect(b);
  ctx.fillStyle = C.dark;
  ctx.fillRect(s.x, s.y, s.w, s.h);
  ctx.fillStyle = C.body;
  ctx.fillRect(s.x + 1.5, s.y + 1.5, s.w - 3, s.h - 3);
  ctx.strokeStyle = C.light;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  const off = ((S.t * BELT_SPEED) % 20) - 20;
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
    ctx.fillStyle = 'rgba(30,44,60,.35)';
    ctx.fillRect(s.x, s.y, s.w, s.h);
  }
  if (b.dirt > 4) {
    ctx.fillStyle = 'rgba(70,40,25,' + Math.min(0.4, b.dirt / 260) + ')';
    ctx.fillRect(s.x, s.y, s.w, s.h);
  }
  if (b.on === false) {
    ctx.fillStyle = 'rgba(10,14,20,.45)';
    ctx.fillRect(s.x, s.y, s.w, s.h);
  }
}

/** Diagonales Band: gestreckter Streifen (Ecke zu Ecke), per 45°/135° gedreht. */
function drawBandDiag(b, inner) {
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
  const off = ((S.t * BELT_SPEED) % 20) - 20;
  for (let i = -1; i < len / 20 + 1; i++) {
    const px = i * 20 - off;
    if (px < -len / 2 + 2 || px > len / 2 - 4) continue;
    ctx.moveTo(px, -6);
    ctx.lineTo(px + 5, 0);
    ctx.lineTo(px, 6);
  }
  ctx.stroke();
  if (inner) {
    ctx.fillStyle = 'rgba(30,44,60,.35)';
    ctx.fillRect(-len / 2, -w / 2, len, w);
  }
  if (b.dirt > 4) {
    ctx.fillStyle = 'rgba(70,40,25,' + Math.min(0.4, b.dirt / 260) + ')';
    ctx.fillRect(-len / 2, -w / 2, len, w);
  }
  if (b.on === false) {
    ctx.fillStyle = 'rgba(10,14,20,.45)';
    ctx.fillRect(-len / 2, -w / 2, len, w);
  }
  ctx.restore();
}

/* -------------------------------- Gebäude -------------------------------- */

function housing(r, col) {
  ctx.fillStyle = '#eef3f9';
  ctx.fillRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
  ctx.fillStyle = col;
  ctx.fillRect(r.x + 2, r.y + 2, r.w - 4, 11);
  ctx.strokeStyle = C.steel;
  ctx.lineWidth = 2;
  ctx.strokeRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
}

function drawPorts(b) {
  const ins = [],
    outs = [];
  const d = DEF[b.t];
  if (b.t === 'belt') {
    outs.push(b.dir);
    ins.push(opp(b.dir));
  } else {
    const dir = b.dir ?? 0;
    for (const r of d.in || []) ins.push((dir + r + 4) & 3);
    for (const r of d.out || []) outs.push((dir + r + 4) & 3);
  }
  const r = bldRect(b);
  const arrow = (dd, col) => {
    const cx = r.x + r.w / 2,
      cy = r.y + r.h / 2;
    const dx = DX[dd] * (r.w / 2),
      dy = DY[dd] * (r.h / 2);
    const px = cx + dx,
      py = cy + dy;
    ctx.fillStyle = col;
    ctx.beginPath();
    const ax = DX[dd] * 8,
      ay = DY[dd] * 8;
    ctx.moveTo(px + ax * 0.5, py + ay * 0.5);
    ctx.lineTo(px - ay * 0.6 + ax * 0.1, py + ax * 0.6 + ay * 0.1);
    ctx.lineTo(px + ay * 0.6 + ax * 0.1, py - ax * 0.6 + ay * 0.1);
    ctx.closePath();
    ctx.fill();
  };
  for (const dd of ins) arrow(dd, 'rgba(47,158,68,.95)');
  for (const dd of outs) arrow(dd, 'rgba(47,129,248,.95)');
}

function drawPipe(b, vis) {
  const r = bldRect(b);
  const cx = r.x + CELL / 2,
    cy = r.y + CELL / 2;
  const nb = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
  ];
  ctx.strokeStyle = '#8a3a3a';
  ctx.lineWidth = 11;
  ctx.lineCap = 'butt';
  for (const [dx, dy] of nb) {
    const o = bldAtCell(b.x + dx, b.y + dy);
    if (!o || o.t !== 'pipe') continue;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + dx * CELL * 0.6, cy + dy * CELL * 0.6);
    ctx.stroke();
  }
  ctx.fillStyle = '#8a3a3a';
  ctx.fillRect(cx - 14, cy - 14, 28, 28);
  ctx.fillStyle = '#b05555';
  ctx.beginPath();
  ctx.arc(cx, cy, 9, 0, 7);
  ctx.fill();
  if (b.dirt > 4) {
    ctx.fillStyle = 'rgba(50,25,15,' + Math.min(0.5, b.dirt / 160) + ')';
    ctx.fillRect(cx - 14, cy - 14, 28, 28);
  }
  const pulse = reducedMotion() ? CELL * 0.3 : (S.t * 60 + b.id * 13) % CELL;
  ctx.fillStyle = 'rgba(214,64,48,.55)';
  ctx.beginPath();
  ctx.arc(cx - 12 + pulse * 0.5, cy, 3.4, 0, 7);
  ctx.fill();
  void vis;
}

function drawMachineBody(b, r) {
  const d = DEF[b.t];
  housing(r, d.col);
  const cx = r.x + r.w / 2,
    cy = r.y + r.h / 2;
  const on = b.clean <= 0 && b.on !== false && S.pf > 0.15;
  switch (b.t) {
    case 'spawn': {
      ctx.fillStyle = 'rgba(45,64,90,' + (0.12 + 0.08 * Math.sin(S.t * 3)) + ')';
      ctx.fillRect(r.x + 8, r.y + 16, r.w - 40, r.h - 26);
      ctx.strokeStyle = C.steel;
      ctx.lineWidth = 2;
      ctx.strokeRect(r.x + 8, r.y + 16, r.w - 40, r.h - 26);
      ctx.fillStyle = C.bright;
      ctx.beginPath();
      const dx = [10, 0, -10, 0][b.dir ?? 0],
        dy = [0, 10, 0, -10][b.dir ?? 0];
      ctx.moveTo(cx + dx, cy + dy);
      ctx.lineTo(cx + dy * 0.7 - dx * 0.4, cy - dx * 0.7 - dy * 0.4);
      ctx.lineTo(cx - dy * 0.7 - dx * 0.4, cy + dx * 0.7 - dy * 0.4);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'spike': {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(S.running && on ? S.t * 3 : 0);
      ctx.fillStyle = C.bright;
      ctx.beginPath();
      for (let i = 0; i < 32; i++) {
        const a = (i * Math.PI) / 16,
          rad = i % 2 ? 15 : 26;
        ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = C.accent2;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, 7);
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 'blade': {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.strokeStyle = C.bright;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      const a = S.running && on ? Math.sin(S.t * 8) * 0.25 : 0.2;
      ctx.beginPath();
      ctx.moveTo(-24 * Math.cos(a), -24 * Math.sin(a) - 12);
      ctx.lineTo(24 * Math.cos(a), 24 * Math.sin(a) + 12);
      ctx.moveTo(-24 * Math.cos(a), -24 * Math.sin(a) + 12);
      ctx.lineTo(24 * Math.cos(a), 24 * Math.sin(a) - 12);
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 'press': {
      const ph = (b.items[0]?.prog || 0) % 1.4;
      const py = r.y + 8 + (ph < 0.5 ? 14 : 0) + 6;
      ctx.fillStyle = C.light;
      ctx.fillRect(cx - 5, r.y + 13, 10, py - r.y - 13);
      ctx.fillStyle = C.accent;
      ctx.fillRect(r.x + 12, py, r.w - 24, 14);
      ctx.fillStyle = C.accent2;
      ctx.fillRect(r.x + 12, py, r.w - 24, 3);
      break;
    }
    case 'schleuder': {
      const a = S.running && on ? S.t * 7 : 0.6;
      ctx.strokeStyle = C.light;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(cx - Math.cos(a) * 26, cy - Math.sin(a) * 26);
      ctx.lineTo(cx + Math.cos(a) * 26, cy + Math.sin(a) * 26);
      ctx.stroke();
      ctx.fillStyle = C.accent2;
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, 7);
      ctx.fill();
      break;
    }
    case 'weiche':
    case 'merge':
    case 'filter': {
      ctx.font = 'bold 20px ui-monospace,monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = on ? C.bright : C.steel;
      ctx.fillText(d.g, cx, cy + 7);
      ctx.textAlign = 'left';
      const q = b.items.length;
      for (let i = 0; i < q; i++) {
        ctx.fillStyle = C.accent2;
        ctx.beginPath();
        ctx.arc(r.x + 7 + i * 9, r.y + r.h - 7, 3, 0, 7);
        ctx.fill();
      }
      break;
    }
    case 'bin': {
      ctx.fillStyle = 'rgba(30,48,62,.35)';
      ctx.fillRect(r.x + 7, r.y + 15, r.w - 14, r.h - 22);
      b.items.forEach((it, i) => {
        const ix = r.x + 24 + (i % 4) * 26,
          iy = r.y + r.h - 14 - Math.floor(i / 4) * 14;
        if (it.kind === 'limb') {
          ctx.save();
          ctx.translate(ix, iy);
          ctx.rotate((it.rot || 0) * 1.5);
          ctx.strokeStyle = C.dim;
          ctx.fillStyle = C.dim;
          ctx.lineWidth = 2.2;
          drawLimbShape(it.part || 'armL', 0, 0);
          ctx.restore();
        } else
          drawCorpseShape(ix, iy, (it.rot || 0) * 1.5 + i, 0.85, it.missing);
      });
      const f = b.items.length / (DEF.bin.cap || 9);
      ctx.fillStyle = 'rgba(20,32,45,.4)';
      ctx.fillRect(r.x + 8, r.y - 8, r.w - 16, 6);
      ctx.fillStyle = f > 0.75 ? C.accent2 : C.dim;
      ctx.fillRect(r.x + 8, r.y - 8, (r.w - 16) * f, 6);
      break;
    }
    case 'oven': {
      ctx.fillStyle = 'rgba(30,48,62,.35)';
      ctx.fillRect(r.x + 12, r.y + 16, r.w - 24, r.h - 24);
      if (b.items.length && b.clean <= 0) {
        ctx.fillStyle = 'rgba(229,120,50,' + (0.5 + 0.25 * Math.sin(S.t * 9)) + ')';
        ctx.fillRect(r.x + 16, r.y + 20, r.w - 32, r.h - 32);
      }
      ctx.fillStyle = 'rgba(20,32,45,.4)';
      ctx.fillRect(r.x + 8, r.y - 8, r.w - 16, 6);
      ctx.fillStyle = C.warn;
      ctx.fillRect(r.x + 8, r.y - 8, (r.w - 16) * clamp((b.prog || 0) / 1.4, 0, 1), 6);
      break;
    }
    case 'acid': {
      const lvl = r.y + r.h * 0.55;
      ctx.fillStyle = 'rgba(120,200,110,.55)';
      ctx.beginPath();
      ctx.moveTo(r.x + 7, r.y + r.h - 4);
      ctx.lineTo(r.x + 7, lvl);
      for (let i = 0; i <= r.w - 14; i += 8)
        ctx.lineTo(r.x + 7 + i, lvl + Math.sin(S.t * 3.2 + i * 0.13) * 2.6);
      ctx.lineTo(r.x + r.w - 7, r.y + r.h - 4);
      ctx.fill();
      ctx.strokeStyle = C.steel;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(r.x + 5, r.y + 13, r.w - 10, r.h - 17);
      ctx.fillStyle = 'rgba(20,32,45,.4)';
      ctx.fillRect(r.x + 8, r.y - 8, r.w - 16, 6);
      ctx.fillStyle = C.ok;
      ctx.fillRect(r.x + 8, r.y - 8, (r.w - 16) * clamp((b.prog || 0) / 1.7, 0, 1), 6);
      break;
    }
    case 'shop': {
      ctx.font = 'bold 22px ui-monospace,monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = on ? C.bright : C.steel;
      ctx.fillText(d.g, cx, cy + 7);
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(20,32,45,.4)';
      ctx.fillRect(r.x + 6, r.y - 8, r.w - 12, 6);
      ctx.fillStyle = C.ok;
      ctx.fillRect(r.x + 6, r.y - 8, (r.w - 12) * clamp((b.prog || 0) / 0.9, 0, 1), 6);
      break;
    }
    case 'tank': {
      const net = b.netId >= 0 ? nets[b.netId] : null;
      const v = net ? net.v : S.blood;
      const cap = net ? net.cap : S.bloodCap;
      const fh = (r.h - 26) * clamp(v / Math.max(1, cap), 0, 1);
      ctx.fillStyle = 'rgba(30,48,62,.28)';
      ctx.fillRect(r.x + 11, r.y + 15, r.w - 22, r.h - 22);
      ctx.fillStyle = bloodColor();
      ctx.fillRect(r.x + 11, r.y + r.h - 7 - fh, r.w - 22, fh);
      ctx.strokeStyle = C.steel;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(r.x + 11, r.y + 15, r.w - 22, r.h - 22);
      break;
    }
    case 'drain': {
      ctx.fillStyle = 'rgba(30,48,62,.4)';
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
        ctx.fillStyle = 'rgba(214,64,48,' + b.glow * 0.7 + ')';
        ctx.beginPath();
        ctx.arc(cx, cy, 8 + b.glow * 4, 0, 7);
        ctx.fill();
      }
      break;
    }
    case 'market': {
      ctx.font = 'bold 26px ui-monospace,monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = on && b.link === 'ok' ? C.bright : C.steel;
      ctx.fillText(d.g, cx, cy + 9);
      ctx.textAlign = 'left';
      if (b.reserveTouched) {
        ctx.fillStyle = C.accent2;
        ctx.fillRect(r.x + 5, r.y + 15, 5, r.h - 22);
      }
      break;
    }
    case 'gen': {
      ctx.font = 'bold 26px ui-monospace,monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = b.glow > 0.05 ? C.warn : C.steel;
      ctx.fillText(d.g, cx, cy + 9);
      ctx.textAlign = 'left';
      break;
    }
    case 'lab': {
      ctx.font = 'bold 24px ui-monospace,monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = on ? C.accent2 : C.steel;
      ctx.fillText(d.g, cx, cy + 8);
      ctx.textAlign = 'left';
      break;
    }
    default:
      break;
  }
  if (DEF[b.t].kind === 'pass') drawBandStrip(b, true);
}

function drawItems(b) {
  for (const it of b.items) {
    const p = itemPos(b, it);
    drawItemAt(b, it, p.x, p.y);
  }
}

function drawItemAt(b, it, x, y) {
  if (it.kind === 'stick') {
    drawStickFigure(x, y - 2, it.body, (it.anim || 0) + S.t, false, it.chair);
    return;
  }
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

function drawBuilding(b, showPorts) {
  const d = DEF[b.t];
  const r = bldRect(b);
  if (d.kind === 'pipe') {
    drawPipe(b);
    return;
  }
  if (d.kind === 'belt') {
    drawBandStrip(b, false);
  } else {
    ctx.fillStyle = 'rgba(17,28,42,.18)';
    ctx.beginPath();
    ctx.ellipse(r.x + r.w / 2, r.y + r.h, r.w * 0.42, 4, 0, 0, 7);
    ctx.fill();
    drawMachineBody(b, r);
  }
  if (d.kind === 'belt' || d.kind === 'pass' || d.kind === 'route')
    drawItems(b);

  if (b.on === false && d.kind !== 'pipe') {
    ctx.fillStyle = 'rgba(0,0,0,.4)';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = C.steel;
    ctx.font = 'bold 10px ui-monospace,monospace';
    ctx.textAlign = 'center';
    ctx.fillText('AUS', r.x + r.w / 2, r.y + r.h / 2 + 3);
    ctx.textAlign = 'left';
  }
  if (b.clean > 0) {
    ctx.fillStyle = 'rgba(190,190,190,.2)';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = C.bright;
    ctx.font = '600 10px ui-monospace,monospace';
    ctx.textAlign = 'center';
    ctx.fillText('REINIGUNG ' + b.clean.toFixed(1) + 's', r.x + r.w / 2, r.y - 6);
    ctx.textAlign = 'left';
  }
  if (d.dirt && b.dirt > 6 && b.clean <= 0 && d.kind !== 'pipe') {
    const w = r.w - 12;
    ctx.fillStyle = 'rgba(15,25,40,.4)';
    ctx.fillRect(r.x + 6, r.y - 9, w, 6);
    ctx.fillStyle = b.dirt > 70 ? C.err : b.dirt > 40 ? C.warn : C.ok;
    ctx.fillRect(r.x + 6, r.y - 9, w * (1 - b.dirt / 100), 6);
  }
  if (b.link === 'none' && b.clean <= 0 && d.kind !== 'pipe' && d.kind !== 'belt') {
    ctx.fillStyle = 'rgba(229,72,58,.92)';
    ctx.fillRect(r.x + r.w / 2 - 6, r.y - 24, 12, 12);
    ctx.fillStyle = '#fff';
    ctx.font = '700 10px ui-monospace,monospace';
    ctx.textAlign = 'center';
    ctx.fillText('!', r.x + r.w / 2, r.y - 15);
    ctx.textAlign = 'left';
  }
  if (showPorts) drawPorts(b);
}

/* --------------------------------- Helfer --------------------------------- */

function cellRect(x, y) {
  return { x: x * CELL, y: y * CELL, w: CELL, h: CELL };
}

function ghostCell(x, y, bad) {
  const r = cellRect(x, y);
  ctx.fillStyle = bad ? 'rgba(229,72,58,.16)' : 'rgba(47,129,248,.14)';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = bad ? C.err : C.accent;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
  ctx.setLineDash([]);
}

function ghostLabel(x, y, text, bad, dy = 0) {
  ctx.font = '600 11.5px ui-monospace,monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = bad ? C.err : C.light;
  ctx.fillText(text, (x + 0.5) * CELL, y * CELL - 14 - dy);
  ctx.textAlign = 'left';
}

/** Vorschau der Bandstrecke: Start zuletzt geklickt, unter dem Cursor das Ende. */
function drawBeltGhost(cx, cy) {
  const from = S.beltFrom;
  const plan = from ? planBeltPath(from.x, from.y, cx, cy) : null;
  const cells = plan ? plan.cells : [{ x: cx, y: cy }];
  const reason = plan ? plan.reason : placeReason('belt', cx, cy, S.dir);
  const price = plan
    ? plan.cost
    : bldAtCell(cx, cy)
      ? 0
      : costOf('belt');
  const bad = !!reason;
  for (const c of cells) ghostCell(c.x, c.y, bad);
  if (plan && plan.cells.some((c) => c.dir != null)) {
    ctx.strokeStyle = bad ? 'rgba(229,72,58,.9)' : 'rgba(47,129,248,.9)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (const c of cells) {
      if (c.dir == null) continue;
      const cell = { x: c.x, y: c.y, spanW: 1, spanH: 1 };
      const a = edgePoint(cell, c.dir, 0, false);
      const e = edgePoint(cell, c.dir, 0, true);
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(e.x, e.y);
    }
    ctx.stroke();
    ctx.lineCap = 'butt';
  }
  if (from) {
    const r = cellRect(from.x, from.y);
    ctx.strokeStyle = bad ? C.err : C.bright;
    ctx.lineWidth = 3;
    ctx.strokeRect(r.x + 3, r.y + 3, r.w - 6, r.h - 6);
    ctx.fillStyle = bad ? C.err : C.accent2;
    ctx.beginPath();
    ctx.arc(r.x + r.w / 2, r.y + r.h / 2, 5, 0, 7);
    ctx.fill();
  }
  const last = cells[cells.length - 1];
  const head = from ? `FÖRDERBAND · ${cells.length} ZELLEN · ` : 'FÖRDERBAND · ';
  ghostLabel(last.x, last.y, head + price + ' €', bad);
  if (reason) ghostLabel(last.x, last.y, reason.toUpperCase(), bad, 15);
}

function drawGhost() {
  const t = S.tool,
    d = DEF[t];
  if (!d) return;
  const cx = Math.floor(S.wx / CELL),
    cy = Math.floor(S.wy / CELL);
  if (t === 'belt') {
    drawBeltGhost(cx, cy);
    return;
  }
  const { x: x0, y: y0 } = originOf(t, cx, cy);
  const reason = placeReason(t, x0, y0, S.dir);
  for (let y = y0; y < y0 + d.h; y++)
    for (let x = x0; x < x0 + d.w; x++) ghostCell(x, y, !!reason);
  ghostLabel(x0 + (d.w - 1) / 2, y0, d.n.toUpperCase() + ' · ' + (d.cost || 0) + ' €', !!reason);
  if (reason) ghostLabel(x0 + (d.w - 1) / 2, y0, reason.toUpperCase(), true, 15);
}

function drawHints() {
  if (!S.tutCells || !S.tutCells.length) return;
  const a = reducedMotion() ? 0.6 : 0.35 + 0.3 * Math.sin(S.t * 4);
  ctx.strokeStyle = 'rgba(47,158,68,' + a + ')';
  ctx.lineWidth = 3;
  for (const [x, y] of S.tutCells) {
    const r = cellRect(x, y);
    ctx.strokeRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
  }
}

/* --------------------------------- Render --------------------------------- */

export function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, cv.width, cv.height);
  applyCam();

  // Hallenboden
  ctx.fillStyle = C.hall;
  ctx.fillRect(0, 0, PW, PH);
  ctx.strokeStyle = 'rgba(140,160,185,.35)';
  ctx.lineWidth = 3;
  ctx.strokeRect(-2, -2, PW + 4, PH + 4);

  const vis = viewCells(S.cam, vw, vh);

  // Raster
  ctx.lineWidth = 1;
  ctx.strokeStyle = C.grid;
  ctx.beginPath();
  for (let x = vis.x0; x <= vis.x1; x++) {
    ctx.moveTo(x * CELL, vis.y0 * CELL);
    ctx.lineTo(x * CELL, vis.y1 * CELL);
  }
  for (let y = vis.y0; y <= vis.y1; y++) {
    ctx.moveTo(vis.x0 * CELL, y * CELL);
    ctx.lineTo(vis.x1 * CELL, y * CELL);
  }
  ctx.stroke();
  ctx.strokeStyle = C.grid2;
  ctx.beginPath();
  for (let x = Math.ceil(vis.x0 / 8) * 8; x <= vis.x1; x += 8) {
    ctx.moveTo(x * CELL, vis.y0 * CELL);
    ctx.lineTo(x * CELL, vis.y1 * CELL);
  }
  for (let y = Math.ceil(vis.y0 / 8) * 8; y <= vis.y1; y += 8) {
    ctx.moveTo(vis.x0 * CELL, y * CELL);
    ctx.lineTo(vis.x1 * CELL, y * CELL);
  }
  ctx.stroke();

  // Bodenblut
  const bc = bloodColor();
  for (let y = vis.y0; y < vis.y1; y++)
    for (let x = vis.x0; x < vis.x1; x++) {
      const v = floorBlood[y * GRID_W + x];
      if (v < 0.15) continue;
      const h = Math.min(CELL - 4, v * 2.2);
      ctx.globalAlpha = clamp(0.3 + v / 10, 0, 0.85);
      ctx.fillStyle = bc;
      ctx.fillRect(x * CELL + 1, (y + 1) * CELL - h, CELL - 2, h);
    }
  ctx.globalAlpha = 1;

  // Gebäude
  const showPorts = !!S.sel;
  for (const b of blds) {
    if (b.x + b.spanW < vis.x0 || b.x > vis.x1 || b.y + b.spanH < vis.y0 || b.y > vis.y1)
      continue;
    drawBuilding(b, showPorts && S.sel === b);
  }

  // Blut auf Bändern
  for (let y = vis.y0; y < vis.y1; y++)
    for (let x = vis.x0; x < vis.x1; x++) {
      const v = beltBlood[y * GRID_W + x];
      if (v < 0.15) continue;
      const h = Math.min(CELL - 6, v * 1.8);
      ctx.globalAlpha = clamp(0.32 + v / 9, 0, 0.9);
      ctx.fillStyle = bc;
      ctx.fillRect(x * CELL + 2, (y + 1) * CELL - h - 2, CELL - 4, h);
    }
  ctx.globalAlpha = 1;

  // Lose Objekte
  for (const c of corpses) drawCorpse(c);
  for (const s of sticks) drawStickFigure(s.x, s.y, s.body, (s.anim || 0) + S.t, false, s.chair && s.state !== 'fall');

  // Partikel
  for (const p of parts) {
    ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
    ctx.fillStyle = p.color;
    if (p.text) {
      ctx.font = 'bold 12px ui-monospace,monospace';
      ctx.textAlign = 'center';
      ctx.fillText(p.text, p.x, p.y);
      ctx.textAlign = 'left';
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, 7);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  drawHints();

  // Auswahl
  if (S.sel && blds.includes(S.sel)) {
    const r = bldRect(S.sel);
    ctx.fillStyle = 'rgba(47,129,248,.08)';
    ctx.fillRect(r.x - 3, r.y - 3, r.w + 6, r.h + 6);
    ctx.strokeStyle = C.accent2;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(r.x - 3, r.y - 3, r.w + 6, r.h + 6);
    ctx.setLineDash([]);
  }
  if (S.tool) drawGhost();
}

export function resize() {
  const host = cv.parentElement.getBoundingClientRect();
  DPR = window.devicePixelRatio || 1;
  cv.width = Math.max(1, Math.round(host.width * DPR));
  cv.height = Math.max(1, Math.round(host.height * DPR));
  cv.style.width = host.width + 'px';
  cv.style.height = host.height + 'px';
  vw = host.width;
  vh = host.height;
  S.cam.x = clamp(S.cam.x, 0, PW);
  S.cam.y = clamp(S.cam.y, 0, PH);
}
