import { DEF } from '../config/building-defs.js';
import { CELL, DX, DY, GRID_W, PH, PW, opp } from '../config/constants.js';
import { bloodColor, reducedMotion } from '../core/effects.js';
import { itemPos, beltPathPoints } from '../core/belts.js';
import { planBeltPath } from '../core/belt-path.js';
import { costOf, originOf, placeReason } from '../core/placement.js';
import { bldAtCell, bldRect, viewCells } from '../core/grid.js';
import { S, beltBlood, blds, corpses, floorBlood, parts, sticks } from '../core/state.js';
import { clamp } from '../utils/helpers.js';
import { rgba } from '../config/palette.js';
import { C, ctx, cv } from './canvas.js';
import { drawCorpse, drawItemShape, drawStickFigure } from './figures.js';
import { drawBandStrip } from './bands.js';
import { drawMachineBody } from './machines/index.js';

export { cv, C };

export let DPR = 1,
  vw = 1,
  vh = 1;

/** Deterministisches 0–1-Rauschen pro Zelle (stabile Optik, kein Flimmern). */
function cellNoise(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

let floorPat;
/** Einmal gebautes Kachelmuster über dem Hallenboden (subtile Variation). */
function floorPattern() {
  if (floorPat !== undefined) return floorPat;
  floorPat = null;
  if (typeof document === 'undefined') return null;
  try {
    const pc = document.createElement('canvas');
    pc.width = pc.height = CELL;
    const p = pc.getContext && pc.getContext('2d');
    if (!p) return null;
    p.fillStyle = C.hall;
    p.fillRect(0, 0, CELL, CELL);
    const shades = [
      'rgba(0,0,0,0)',
      'rgba(255,255,255,0.015)',
      'rgba(0,0,0,0.022)',
      'rgba(255,255,255,0.008)',
    ];
    for (let i = 0; i < 4; i++) {
      p.fillStyle = shades[i];
      p.fillRect((i % 2) * (CELL / 2), Math.floor(i / 2) * (CELL / 2), CELL / 2, CELL / 2);
    }
    p.fillStyle = 'rgba(0,0,0,0.014)';
    for (let i = 0; i < 10; i++) p.fillRect((i * 37) % CELL, (i * 53) % CELL, 2, 1);
    floorPat = ctx.createPattern(pc, 'repeat');
  } catch {
    floorPat = null;
  }
  return floorPat;
}

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

/* -------------------------------- Gebäude -------------------------------- */

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
  for (const dd of ins) arrow(dd, rgba(C.accentDim, 0.95));
  for (const dd of outs) arrow(dd, rgba(C.accent2, 0.95));
}

function drawPipe(b) {
  const r = bldRect(b);
  const cx = r.x + CELL / 2,
    cy = r.y + CELL / 2;
  const nb = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
  ];
  ctx.strokeStyle = C.pipe;
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
  ctx.fillStyle = C.pipe;
  ctx.fillRect(cx - 14, cy - 14, 28, 28);
  ctx.fillStyle = C.pipe2;
  ctx.beginPath();
  ctx.arc(cx, cy, 9, 0, 7);
  ctx.fill();
  if (b.dirt > 4) {
    ctx.fillStyle = rgba(C.pipeDirt, Math.min(0.5, b.dirt / 160));
    ctx.fillRect(cx - 14, cy - 14, 28, 28);
  }
  const pulse = reducedMotion() ? CELL * 0.3 : (S.t * 60 + b.id * 13) % CELL;
  ctx.fillStyle = rgba(C.glow, 0.55);
  ctx.beginPath();
  ctx.arc(cx - 12 + pulse * 0.5, cy, 3.4, 0, 7);
  ctx.fill();
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
  drawItemShape(it, x, y);
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
    ctx.fillStyle = rgba(C.shadow, 0.18);
    ctx.beginPath();
    ctx.ellipse(r.x + r.w / 2, r.y + r.h, r.w * 0.42, 4, 0, 0, 7);
    ctx.fill();
    drawMachineBody(b, r);
  }
  if (d.kind === 'belt' || d.kind === 'pass' || d.kind === 'route') drawItems(b);

  if (b.on === false && d.kind !== 'pipe') {
    ctx.fillStyle = rgba(C.shade, 0.4);
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = C.steel;
    ctx.font = 'bold 10px ui-monospace,monospace';
    ctx.textAlign = 'center';
    ctx.fillText('AUS', r.x + r.w / 2, r.y + r.h / 2 + 3);
    ctx.textAlign = 'left';
  }
  if (b.clean > 0) {
    ctx.fillStyle = rgba(C.fog, 0.2);
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = C.bright;
    ctx.font = '600 10px ui-monospace,monospace';
    ctx.textAlign = 'center';
    ctx.fillText('REINIGUNG ' + b.clean.toFixed(1) + 's', r.x + r.w / 2, r.y - 6);
    ctx.textAlign = 'left';
  }
  if (d.dirt && b.dirt > 6 && b.clean <= 0 && d.kind !== 'pipe') {
    const w = r.w - 12;
    ctx.fillStyle = rgba(C.dirtBar, 0.4);
    ctx.fillRect(r.x + 6, r.y - 9, w, 6);
    ctx.fillStyle = b.dirt > 70 ? C.err : b.dirt > 40 ? C.warn : C.ok;
    ctx.fillRect(r.x + 6, r.y - 9, w * (1 - b.dirt / 100), 6);
  }
  if (b.link === 'none' && b.clean <= 0 && d.kind !== 'pipe' && d.kind !== 'belt') {
    ctx.fillStyle = rgba(C.err, 0.92);
    ctx.fillRect(r.x + r.w / 2 - 6, r.y - 24, 12, 12);
    ctx.fillStyle = C.white;
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
  ctx.fillStyle = bad ? rgba(C.err, 0.16) : rgba(C.accent, 0.14);
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
  const price = plan ? plan.cost : bldAtCell(cx, cy) ? 0 : costOf('belt');
  const bad = !!reason;
  for (const c of cells) ghostCell(c.x, c.y, bad);
  if (plan && plan.cells.some((c) => c.dir != null)) {
    ctx.strokeStyle = bad ? rgba(C.err, 0.9) : rgba(C.accent2, 0.9);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (const c of cells) {
      if (c.dir == null) continue;
      const cell = { x: c.x, y: c.y, spanW: 1, spanH: 1, t: 'belt', dir: c.dir, fromDir: c.from ?? c.dir };
      const pts = beltPathPoints(cell);
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
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
  ctx.strokeStyle = rgba(C.accentDim, a);
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
  const pat = floorPattern();
  if (pat) {
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, PW, PH);
  }
  // Weicher Übergang zum Dunkeln statt hartem Randstrich
  const grad = ctx.createLinearGradient(0, 0, 0, PH);
  grad.addColorStop(0, rgba(C.bg, 0.55));
  grad.addColorStop(0.12, rgba(C.bg, 0));
  grad.addColorStop(0.88, rgba(C.bg, 0));
  grad.addColorStop(1, rgba(C.bg, 0.55));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, PW, PH);
  const gradL = ctx.createLinearGradient(0, 0, PW, 0);
  gradL.addColorStop(0, rgba(C.bg, 0.55));
  gradL.addColorStop(0.06, rgba(C.bg, 0));
  gradL.addColorStop(0.94, rgba(C.bg, 0));
  gradL.addColorStop(1, rgba(C.bg, 0.55));
  ctx.fillStyle = gradL;
  ctx.fillRect(0, 0, PW, PH);
  // Dezente Hallenkante
  ctx.strokeStyle = rgba(C.hallEdge, 0.22);
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, PW - 2, PH - 2);

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

  // Bodenblut – weiche Flecken statt Rechteckstreifen
  const bc = bloodColor();
  for (let y = vis.y0; y < vis.y1; y++)
    for (let x = vis.x0; x < vis.x1; x++) {
      const v = floorBlood[y * GRID_W + x];
      if (v < 0.15) continue;
      const n = cellNoise(x, y),
        n2 = cellNoise(x + 37, y + 11);
      const rr = CELL * 0.32 * (0.55 + Math.min(v, 10) / 10) * (0.85 + n * 0.3);
      ctx.globalAlpha = clamp(0.3 + v / 12, 0, 0.85);
      ctx.fillStyle = bc;
      ctx.beginPath();
      ctx.ellipse(
        x * CELL + CELL / 2 + (n - 0.5) * CELL * 0.25,
        y * CELL + CELL / 2 + (n2 - 0.5) * CELL * 0.25,
        rr,
        rr * (0.7 + n2 * 0.35),
        n * 6.28,
        0,
        7,
      );
      ctx.fill();
    }
  ctx.globalAlpha = 1;

  // Gebäude
  const showPorts = !!S.sel;
  for (const b of blds) {
    if (b.x + b.spanW < vis.x0 || b.x > vis.x1 || b.y + b.spanH < vis.y0 || b.y > vis.y1) continue;
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
    ctx.fillStyle = rgba(C.accent, 0.08);
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
