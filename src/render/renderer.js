import { DEF } from '../config/building-defs.js';
import {
  BELT_H,
  BELT_SPEED,
  BELT_Y,
  CELL,
  CHAIRS,
  COLS,
  H,
  KELLER_FLOOR,
  KELLER_TOP,
  OBEN_FLOOR,
  OBEN_TOP,
  PW,
  STAND_TIME,
  W,
  X0,
} from '../config/constants.js';
import { bloodColor } from '../core/effects.js';
import { horizontal, vertical } from '../core/flow.js';
import { bldRect, chairX, placeReason } from '../core/placement.js';
import { S, beltBlood, blds, corpses, floorBlood, parts, sticks } from '../core/state.js';
import { $, clamp, colX, lerp } from '../utils/helpers.js';

export const cv = $('cv'),
  ctx = cv.getContext('2d');
export let vScale = 1,
  vOffX = 0,
  vOffY = 0,
  DPR = 1,
  bgCanvas;
export const C = {
  bg: '#e6ebf2',
  dark: '#c8d2de',
  body: '#d7dfe9',
  steel: '#7c8a9a',
  light: '#3c4a5a',
  bright: '#111c2a',
  dim: '#5d6b7a',
  accent: '#1d7fd6',
  accent2: '#2f81f8',
  err: '#e5483a',
  warn: '#e0a040',
  ok: '#2f9e44',
};

export function buildBackground() {
  const c = document.createElement('canvas');
  c.width = W * 2;
  c.height = H * 2;
  const g = c.getContext('2d');
  g.scale(2, 2);
  g.fillStyle = C.bg;
  g.fillRect(0, 0, W, H);
  // zarte Boden-/Wandplatten der drei Hallen
  const panel = (y0, y1) => {
    g.fillStyle = '#dfe5ee';
    g.fillRect(X0 - 14, y0, PW + 28, y1 - y0);
    g.strokeStyle = 'rgba(120,138,158,.16)';
    g.lineWidth = 1;
    for (let x = X0; x <= X0 + PW; x += 96) {
      g.beginPath();
      g.moveTo(x, y0);
      g.lineTo(x, y1);
      g.stroke();
    }
    for (let y = y0 + 32; y < y1; y += 32) {
      g.beginPath();
      g.moveTo(X0 - 14, y);
      g.lineTo(X0 + PW + 14, y);
      g.stroke();
    }
  };
  panel(OBEN_TOP, OBEN_FLOOR);
  panel(OBEN_FLOOR + 16, BELT_Y - 4);
  panel(KELLER_TOP, KELLER_FLOOR);
  // Flure öffnen – dunklere Zwischenzonen
  g.fillStyle = '#c4cfdb';
  g.fillRect(X0 - 14, OBEN_FLOOR, PW + 28, 16);
  g.fillRect(X0 - 14, BELT_Y + BELT_H, PW + 28, KELLER_TOP - BELT_Y - BELT_H);
  // Decken-/Boden-Schienen in Chrom
  g.fillStyle = C.steel;
  g.fillRect(X0 - 16, OBEN_FLOOR - 2, PW + 32, 3);
  g.fillRect(X0 - 16, KELLER_TOP, PW + 32, 3);
  g.fillRect(X0 - 16, KELLER_FLOOR, PW + 32, 3);
  g.fillRect(X0 - 16, OBEN_TOP, 16, BELT_Y - OBEN_TOP);
  g.fillRect(X0 + PW, OBEN_TOP, 16, BELT_Y - OBEN_TOP);
  // blaue LED-Leiste am Obergeschoss
  g.fillStyle = C.accent2;
  g.fillRect(X0, OBEN_TOP, PW, 3);
  g.fillStyle = 'rgba(47,129,248,.18)';
  for (let x = X0 + 24; x < X0 + PW; x += 40) g.fillRect(x, OBEN_TOP - 4, 16, 7);
  g.strokeStyle = C.light;
  g.lineWidth = 1;
  g.strokeRect(X0 - 14, OBEN_FLOOR + 15, PW + 28, BELT_Y - OBEN_FLOOR - 15);
  g.fillStyle = 'rgba(47,129,248,.1)';
  g.fillRect(X0 - 14, OBEN_FLOOR + 15, PW + 28, BELT_Y - OBEN_FLOOR - 15);
  g.fillStyle = C.light;
  g.font = '700 10.5px ui-monospace,monospace';
  g.fillText('OBERGESCHOSS · BLUTMARKT', X0 + 8, OBEN_TOP + 15);
  g.fillText('HALLE · FERTIGUNG', X0 + 8, OBEN_FLOOR + 30);
  g.fillStyle = C.dim;
  g.font = '500 10.5px ui-monospace,monospace';
  g.fillText('KELLER · ROHRLEITUNG', X0 + 8, KELLER_TOP + 16);
  return c;
}

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

/** Einzelne abgerissene Gliedmaße. */
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

export function drawStick(s) {
  if (s.state === 'sit') return drawSeated(s);
  const body = s.body,
    has = (p) => !body || body.limbs[p],
    x = s.x,
    y = s.y,
    stand = s.state === 'stand';
  const sw = stand ? 0 : Math.sin(s.anim * 13) * (body && body.hp < 45 ? 7.5 : 5);
  ctx.strokeStyle = C.bright;
  ctx.fillStyle = C.bright;
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (has('legL')) {
    ctx.moveTo(x, y - 12);
    ctx.lineTo(x - 5 + sw * 0.7, y);
  } else {
    ctx.moveTo(x, y - 12);
    ctx.lineTo(x - 4, y - 6);
  }
  if (has('legR')) {
    ctx.moveTo(x, y - 12);
    ctx.lineTo(x + 5 - sw * 0.7, y);
  } else {
    ctx.moveTo(x, y - 12);
    ctx.lineTo(x + 4, y - 6);
  }
  ctx.moveTo(x, y - 24);
  ctx.lineTo(x, y - 12);
  if (has('armL')) {
    ctx.moveTo(x, y - 21);
    ctx.lineTo(x - 7, y - 14 + sw);
  } else {
    ctx.moveTo(x, y - 21);
    ctx.lineTo(x - 5, y - 18);
  }
  if (has('armR')) {
    ctx.moveTo(x, y - 21);
    ctx.lineTo(x + 7, y - 14 - sw);
  } else {
    ctx.moveTo(x, y - 21);
    ctx.lineTo(x + 5, y - 18);
  }
  ctx.stroke();
  if (has('head')) {
    ctx.beginPath();
    ctx.arc(x, y - 29, 5.2, 0, 7);
    ctx.fill();
  }
  if (body && body.bleeding > 0 && !stand) {
    ctx.fillStyle = bloodColor();
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(x - 3, y - 1, 1.8, 0, 7);
    ctx.arc(x + 4, y - 3, 1.4, 0, 7);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

/** Wartende Sticks: sitzen angekettet im Eingang. */
function drawSeated(s) {
  const body = s.body,
    has = (p) => !body || body.limbs[p],
    x = s.x,
    y = s.y,
    rise = s.state === 'stand' ? clamp(1 - s.standT / STAND_TIME, 0, 1) : 0;
  ctx.save();
  ctx.translate(0, -rise * 8);
  ctx.strokeStyle = C.steel;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 9, y - 18);
  ctx.lineTo(x + 15, y - 6);
  ctx.stroke();
  ctx.strokeStyle = C.bright;
  ctx.fillStyle = C.bright;
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  const breathe = Math.sin(s.anim * 2.2) * 1.2;
  ctx.beginPath();
  ctx.moveTo(x - 2, y - 18);
  ctx.lineTo(x, y - 44 + breathe);
  ctx.moveTo(x - 2, y - 18);
  ctx.lineTo(x + 11, y - 16);
  ctx.lineTo(x + 12, y - 1);
  if (has('armL') || has('armR')) {
    ctx.moveTo(x, y - 40 + breathe);
    ctx.lineTo(x + 6, y - 30);
    ctx.lineTo(x + 11, y - 19);
  }
  ctx.stroke();
  if (has('head')) {
    ctx.beginPath();
    ctx.arc(x + 1, y - 51 + breathe, 5.2, 0, 7);
    ctx.fill();
  }
  if (body && body.bleeding > 0) {
    ctx.fillStyle = bloodColor();
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(x + 9, y - 4, 1.8, 0, 7);
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
  } else {
    drawCorpseShape(0, 0, 0, clamp(c.life / 12, 0, 1), c.missing);
  }
  ctx.restore();
}

export function drawBelt(b, r) {
  ctx.fillStyle = C.dark;
  ctx.fillRect(r.x, r.y, r.w, BELT_H);
  ctx.fillStyle = C.body;
  ctx.fillRect(r.x, r.y + 1.5, r.w, BELT_H - 3);
  ctx.fillStyle = C.steel;
  ctx.fillRect(r.x, r.y, r.w, 1.5);
  ctx.fillRect(r.x, r.y + BELT_H - 1.5, r.w, 1.5);
  const off = (S.t * BELT_SPEED) % 18;
  ctx.strokeStyle = C.light;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = -1; i < r.w / 18 + 1; i++) {
    const px = r.x + i * 18 + off;
    if (px < r.x + 1 || px > r.x + r.w - 3) continue;
    ctx.moveTo(px, r.y + 3);
    ctx.lineTo(px + 5, r.y + 7);
    ctx.lineTo(px, r.y + 12);
  }
  ctx.stroke();
  if (b.dirt > 4) {
    ctx.fillStyle = 'rgba(70,40,25,' + Math.min(0.42, b.dirt / 260) + ')';
    ctx.fillRect(r.x, r.y, r.w, BELT_H);
  }
}

export function drawMachine(b, r) {
  const d = DEF[b.t],
    on = S.pf > 0.15 && b.clean <= 0,
    cx = r.x + r.w / 2;
  ctx.fillStyle = '#eef3f9';
  ctx.fillRect(r.x + 3, r.y + 4, r.w - 6, r.h - 4);
  ctx.fillStyle = d.col;
  ctx.fillRect(r.x + 3, r.y + 4, r.w - 6, 12);
  ctx.strokeStyle = C.steel;
  ctx.lineWidth = 2;
  ctx.strokeRect(r.x + 3, r.y + 4, r.w - 6, r.h - 4);
  ctx.fillStyle = C.steel;
  for (const x of [r.x + 9, r.x + r.w - 9]) {
    ctx.beginPath();
    ctx.arc(x, r.y + 10, 1.8, 0, 7);
    ctx.fill();
  }
  switch (b.t) {
    case 'spike': {
      ctx.save();
      ctx.translate(cx, r.y + 66);
      ctx.rotate(S.running && on ? S.t * 3 : 0);
      ctx.fillStyle = C.bright;
      ctx.beginPath();
      for (let i = 0; i < 32; i++) {
        const a = (i * Math.PI) / 16,
          rad = i % 2 ? 28 : 40;
        ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = C.accent2;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, 17, 0, 7);
      ctx.stroke();
      ctx.fillStyle = '#f4f8fc';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, 7);
      ctx.fill();
      ctx.restore();
      break;
    }
    case 'press': {
      const py = lerp(r.y + 34, r.y + 88, b.phase % 1.4 < 0.5 ? 1 : 0);
      ctx.fillStyle = C.light;
      ctx.fillRect(cx - 4, r.y + 20, 8, py - r.y - 20);
      ctx.fillStyle = C.accent;
      ctx.fillRect(r.x + 14, py, r.w - 28, 17);
      ctx.fillStyle = C.accent2;
      ctx.fillRect(r.x + 14, py, r.w - 28, 3);
      break;
    }
    case 'spawn': {
      // Eingangstür links, Sitzreihe mittig, Ausgang aufs Band rechts
      ctx.fillStyle = 'rgba(45,64,90,' + (0.12 + 0.08 * Math.sin(S.t * 3)) + ')';
      ctx.fillRect(r.x + 7, r.y + 18, 26, r.h - 24);
      ctx.strokeStyle = C.steel;
      ctx.lineWidth = 2;
      ctx.strokeRect(r.x + 7, r.y + 18, 26, r.h - 24);
      ctx.fillStyle = C.bright;
      ctx.beginPath();
      ctx.moveTo(r.x + 15, r.y + r.h / 2 - 8);
      ctx.lineTo(r.x + 27, r.y + r.h / 2);
      ctx.lineTo(r.x + 15, r.y + r.h / 2 + 8);
      ctx.fill();
      for (let i = 0; i < CHAIRS; i++) {
        const x = chairX(b, i);
        ctx.strokeStyle = C.steel;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(x - 8, BELT_Y - 36);
        ctx.lineTo(x - 8, BELT_Y - 2);
        ctx.moveTo(x - 8, BELT_Y - 18);
        ctx.lineTo(x + 13, BELT_Y - 18);
        ctx.moveTo(x + 12, BELT_Y - 18);
        ctx.lineTo(x + 14, BELT_Y - 2);
        ctx.stroke();
      }
      break;
    }
    case 'tank': {
      const fh = (r.h - 34) * clamp(S.blood / S.bloodCap, 0, 1);
      ctx.fillStyle = 'rgba(30,48,62,.28)';
      ctx.fillRect(r.x + 13, r.y + 20, r.w - 26, r.h - 30);
      ctx.fillStyle = bloodColor();
      ctx.fillRect(r.x + 13, r.y + r.h - 12 - fh, r.w - 26, fh);
      ctx.strokeStyle = C.steel;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(r.x + 13, r.y + 20, r.w - 26, r.h - 30);
      break;
    }
    case 'bin': {
      ctx.fillStyle = 'rgba(30,48,62,.35)';
      ctx.fillRect(r.x + 8, r.y + 20, r.w - 16, r.h - 28);
      b.items.forEach((it, i) => {
        const ix = r.x + 26 + (i % 4) * 30,
          iy = r.y + r.h - 18 - Math.floor(i / 4) * 16;
        if (it.kind === 'limb') {
          ctx.strokeStyle = C.dim;
          ctx.fillStyle = C.dim;
          ctx.lineWidth = 2.4;
          ctx.save();
          ctx.translate(ix, iy);
          ctx.rotate(it.rot * 1.5);
          drawLimbShape(it.part || 'armL', 0, 0);
          ctx.restore();
        } else
          drawCorpseShape(ix, iy, it.rot * 1.5 + i, 0.85 - clamp(it.rot / 9, 0, 1) * 0.3);
      });
      const f = b.items.length / 9;
      ctx.fillStyle = 'rgba(20,32,45,.4)';
      ctx.fillRect(r.x + 10, r.y - 8, r.w - 20, 5);
      ctx.fillStyle = f > 0.75 ? C.accent2 : C.dim;
      ctx.fillRect(r.x + 10, r.y - 8, (r.w - 20) * f, 5);
      break;
    }
    case 'oven': {
      ctx.fillStyle = 'rgba(30,48,62,.35)';
      ctx.fillRect(r.x + 14, r.y + 30, r.w - 28, r.h - 50);
      if (b.items.length && b.clean <= 0) {
        ctx.fillStyle = 'rgba(229,120,50,' + (0.5 + 0.25 * Math.sin(S.t * 9)) + ')';
        ctx.fillRect(r.x + 18, r.y + 40, r.w - 36, r.h - 70);
        ctx.fillStyle = 'rgba(20,32,45,.4)';
        ctx.fillRect(r.x + 12, r.y - 8, r.w - 24, 5);
        ctx.fillStyle = C.light;
        ctx.fillRect(r.x + 12, r.y - 8, (r.w - 24) * clamp(b.prog / 1.4, 0, 1), 5);
      }
      break;
    }
    case 'acid': {
      const lvl = r.y + 50;
      ctx.fillStyle = 'rgba(120,200,110,.55)';
      ctx.beginPath();
      ctx.moveTo(r.x + 10, r.y + r.h - 6);
      ctx.lineTo(r.x + 10, lvl);
      for (let i = 0; i <= r.w - 20; i += 8)
        ctx.lineTo(r.x + 10 + i, lvl + Math.sin(S.t * 3.2 + i * 0.13) * 2.6);
      ctx.lineTo(r.x + r.w - 10, r.y + r.h - 6);
      ctx.fill();
      ctx.strokeStyle = C.steel;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(r.x + 6, r.y + 14, r.w - 12, r.h - 20);
      b.items.forEach((it, i) => {
        const ix = r.x + 30 + i * 26;
        if (it.kind === 'limb') {
          ctx.strokeStyle = '#7f9f7f';
          ctx.fillStyle = '#7f9f7f';
          ctx.lineWidth = 2.4;
          ctx.save();
          ctx.translate(ix, lvl + 10);
          ctx.rotate(S.t * 2 + i);
          drawLimbShape(it.part || 'armL', 0, 0);
          ctx.restore();
        } else drawCorpseShape(ix, lvl + 10, S.t * 2 + i, 0.7);
      });
      if (b.items.length) {
        ctx.fillStyle = 'rgba(20,32,45,.4)';
        ctx.fillRect(r.x + 12, r.y + 6, r.w - 24, 5);
        ctx.fillStyle = C.dim;
        ctx.fillRect(r.x + 12, r.y + 6, (r.w - 24) * clamp(b.prog / 1.7, 0, 1), 5);
      }
      break;
    }
    default: {
      ctx.font = 'bold 30px ui-monospace,monospace';
      ctx.textAlign = 'center';
      const act =
        b.t === 'gen' || b.t === 'drain'
          ? b.glow > 0.05
          : b.t === 'market'
            ? S.blood > 0 && on
            : on;
      ctx.fillStyle = act ? C.bright : C.steel;
      ctx.fillText(d.g, cx, r.y + r.h / 2 + 14);
      ctx.textAlign = 'left';
    }
  }
  ctx.fillStyle = S.running && on && b.on !== false ? C.accent2 : C.steel;
  ctx.beginPath();
  ctx.arc(r.x + r.w - 14, r.y + 10, 2.5, 0, 7);
  ctx.fill();
}

export function drawBuilding(b) {
  const r = bldRect(b),
    d = DEF[b.t];
  if (d.band === 'belt') drawBelt(b, r);
  else drawMachine(b, r);
  if (b.on === false && d.band !== 'belt') {
    ctx.fillStyle = 'rgba(0,0,0,.38)';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = C.steel;
    ctx.font = 'bold 10px ui-monospace,monospace';
    ctx.textAlign = 'center';
    ctx.fillText('AUS', r.x + r.w / 2, r.y + r.h / 2 + 3);
    ctx.textAlign = 'left';
  }
  if (b.clean > 0) {
    ctx.fillStyle = 'rgba(190,190,190,.18)';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = C.bright;
    ctx.font = '600 11px ui-monospace,monospace';
    ctx.textAlign = 'center';
    ctx.fillText('REINIGUNG ' + b.clean.toFixed(1) + 's', r.x + r.w / 2, r.y - 6);
    ctx.textAlign = 'left';
  }
  if (d.dirt && b.dirt > 4 && b.clean <= 0) {
    const w = r.w - 12;
    ctx.fillStyle = 'rgba(15,25,40,.35)';
    ctx.fillRect(r.x + 6, r.y - 9, w, 5);
    ctx.fillStyle = b.dirt > 70 ? C.err : b.dirt > 40 ? C.warn : C.ok;
    ctx.fillRect(r.x + 6, r.y - 9, w * (1 - b.dirt / 100), 5);
  }
  if (S.pf < 0.4 && d.e > 0 && b.clean <= 0) {
    ctx.fillStyle = '#e0a040';
    ctx.beginPath();
    ctx.arc(r.x + r.w / 2, r.y - 20, 6, 0, 7);
    ctx.fill();
    ctx.fillStyle = C.bg;
    ctx.font = 'bold 9px ui-monospace,monospace';
    ctx.textAlign = 'center';
    ctx.fillText('!', r.x + r.w / 2, r.y - 17);
    ctx.textAlign = 'left';
  }
  if (b.link === 'none' && b.clean <= 0) {
    ctx.fillStyle = 'rgba(229,72,58,.9)';
    ctx.fillRect(r.x + r.w / 2 - 5, r.y - 31, 10, 10);
    ctx.fillStyle = C.bg;
    ctx.font = '700 10px ui-monospace,monospace';
    ctx.textAlign = 'center';
    ctx.fillText('!', r.x + r.w / 2, r.y - 22);
    ctx.textAlign = 'left';
  }
}

/** Verbindungsrohre angezeigter Systeme – sichtbar, wenn eine Verbindung steht. */
function drawPipes() {
  for (const b of blds) {
    if (b.link !== 'ok') continue;
    const target = b.t === 'drain' ? horizontal(b, 'tank') : vertical(b, 'tank');
    if (!target) continue;
    const r = bldRect(b),
      c = bldRect(target);
    let x1,
      y1,
      x2,
      y2;
    if (b.t === 'drain') {
      const hy = r.y + r.h / 2;
      if (c.x < r.x) [x1, y1, x2, y2] = [r.x, hy, c.x + c.w, hy];
      else [x1, y1, x2, y2] = [r.x + r.w, hy, c.x, hy];
    } else {
      const cx = (Math.max(r.x, c.x) + Math.min(r.x + r.w, c.x + c.w)) / 2;
      if (c.y < r.y) [x1, y1, x2, y2] = [cx, r.y, cx, c.y + c.h];
      else [x1, y1, x2, y2] = [cx, r.y + r.h, cx, c.y];
    }
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(120,140,165,.45)';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    if (b.worked || b.pulse > 0) {
      ctx.strokeStyle = 'rgba(214,64,48,.85)';
      ctx.setLineDash([9, 13]);
      ctx.lineDashOffset = -((S.t * 70) % 22);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

export const snapCol = (mx, w) => clamp(Math.floor((mx - X0) / CELL - (w - 1) / 2), 0, COLS - w);
export function drawGhost() {
  const t = S.tool,
    d = DEF[t],
    col = snapCol(S.mx, d.w),
    reason = placeReason(t, col),
    ok = !reason,
    r = bldRect({ t, col, w: d.w });
  ctx.strokeStyle = 'rgba(255,255,255,.04)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let c = 0; c <= COLS; c++) {
    ctx.moveTo(colX(c), 0);
    ctx.lineTo(colX(c), H);
  }
  ctx.stroke();
  ctx.fillStyle = ok ? 'rgba(47,129,248,.12)' : 'rgba(229,72,58,.16)';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = ok ? C.accent : C.err;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(r.x, r.y, r.w, r.h);
  ctx.setLineDash([]);
  ctx.font = '600 11.5px ui-monospace,monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = ok ? C.light : C.bright;
  ctx.fillText(d.n.toUpperCase() + ' · ' + d.cost + ' €', r.x + r.w / 2, r.y - 16);
  if (!ok) {
    ctx.fillStyle = 'rgba(229,72,58,.95)';
    ctx.fillRect(r.x + r.w / 2 - 90, r.y - 34, 180, 17);
    ctx.fillStyle = '#ffe';
    ctx.font = '600 10px ui-monospace,monospace';
    ctx.fillText(reason.toUpperCase(), r.x + r.w / 2, r.y - 22);
  } else if (t === 'drain' || t === 'market' || t === 'gen') {
    ctx.fillStyle = C.dim;
    ctx.font = '500 10px ui-monospace,monospace';
    ctx.fillText(
      t === 'drain' ? '⇒ TANK DANEBEN NÖTIG' : '⇒ TANK DARUNTER NÖTIG',
      r.x + r.w / 2,
      r.y - 26,
    );
  }
  ctx.textAlign = 'left';
}

export function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.setTransform(DPR * vScale, 0, 0, DPR * vScale, vOffX * DPR, vOffY * DPR);
  ctx.drawImage(bgCanvas, 0, 0, W, H);
  for (const b of blds) if (DEF[b.t].band === 'oben') drawBuilding(b);
  for (const b of blds) if (DEF[b.t].band === 'keller') drawBuilding(b);
  drawPipes();
  const bc = bloodColor();
  for (let i = 0; i < COLS; i++) {
    const v = floorBlood[i];
    if (v < 0.15) continue;
    const h = Math.min(11, v * 1.5);
    ctx.globalAlpha = clamp(0.18 + v / 10, 0, 0.85);
    ctx.fillStyle = bc;
    ctx.fillRect(colX(i), KELLER_FLOOR - h + 2, CELL + 0.5, h);
  }
  ctx.globalAlpha = 1;
  for (const b of blds) if (b.t === 'belt') drawBuilding(b);
  for (let i = 0; i < COLS; i++) {
    const v = beltBlood[i];
    if (v < 0.15) continue;
    const h = Math.min(9, v * 1.4);
    ctx.globalAlpha = clamp(0.2 + v / 9, 0, 0.9);
    ctx.fillStyle = bc;
    ctx.fillRect(colX(i), BELT_Y - h + 2, CELL + 0.5, h);
  }
  ctx.globalAlpha = 1;
  for (const c of corpses) if (c.state === 'belt') drawCorpse(c);
  for (const s of sticks) if (s.state === 'walk') drawStick(s);
  for (const b of blds) if (DEF[b.t].band === 'over') drawBuilding(b);
  for (const s of sticks)
    if (s.state === 'sit' || s.state === 'stand' || s.state === 'enter') drawStick(s);
  for (const c of corpses) if (c.state !== 'belt') drawCorpse(c);
  for (const s of sticks) if (s.state === 'fall') drawStick(s);
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
  if (S.tool) drawGhost();
  if (S.sel && blds.includes(S.sel)) {
    const r = bldRect(S.sel);
    ctx.strokeStyle = C.light;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(r.x - 3, r.y - 3, r.w + 6, r.h + 6);
    ctx.setLineDash([]);
  }
}
export function resize() {
  const r = cv.parentElement.getBoundingClientRect();
  DPR = window.devicePixelRatio || 1;
  cv.width = Math.max(1, Math.round(r.width * DPR));
  cv.height = Math.max(1, Math.round(r.height * DPR));
  vScale = Math.min(r.width / W, r.height / H);
  vOffX = (r.width - W * vScale) / 2;
  vOffY = (r.height - H * vScale) / 2;
}

export function initBackground() {
  bgCanvas = buildBackground();
}
