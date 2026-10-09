import { DEF } from '../config/building-defs.js';
import { BELT_SPEED, CELL, DX, DY, compsOf, isDiag } from '../config/constants.js';
import { S, corpses, sticks } from './state.js';
import { bldAtCell, inGrid, portsOf } from './grid.js';
import { upgEff } from './upgrades.js';
import { rnd } from '../utils/helpers.js';

/** Mindestabstand zweier Waren auf einer Bandzelle (0..1 der Zelllänge). */
export const MIN_GAP = 0.45;

export const beltSpeed = () =>
  BELT_SPEED * upgEff('speed') * (S.fx?.beltSpeed ?? 1);

/** Eingangsrichtung einer Zelle. Bänder können um die Ecke führen (`fromDir`). */
export const entryDirOf = (b) => (b.t === 'belt' ? (b.fromDir ?? b.dir) : b.dir);

/** Eintritts-/Austrittspunkt einer Ware: orthogonal auf der Kante, diagonal auf der Ecke. */
export function edgePoint(b, d, lat, atExit) {
  const cx = b.x * CELL,
    cy = b.y * CELL;
  if (d === 0) return { x: atExit ? cx + b.spanW * CELL : cx, y: cy + (lat + 0.5) * CELL };
  if (d === 2) return { x: atExit ? cx : cx + b.spanW * CELL, y: cy + (lat + 0.5) * CELL };
  if (d === 1) return { x: cx + (lat + 0.5) * CELL, y: atExit ? cy + b.spanH * CELL : cy };
  if (d === 3) return { x: cx + (lat + 0.5) * CELL, y: atExit ? cy : cy + b.spanH * CELL };
  const sx = DX[d],
    sy = DY[d];
  const w = b.spanW * CELL,
    h = b.spanH * CELL;
  const ex = atExit ? (sx > 0 ? w : 0) : sx > 0 ? 0 : w;
  const ey = atExit ? (sy > 0 ? h : 0) : sy > 0 ? 0 : h;
  const k = ((lat || 0) * CELL) / Math.SQRT2;
  return { x: cx + ex + sy * k, y: cy + ey - sx * k };
}

/**
 * Wegpunkte einer Zelle: Eintritt → (optional Zellmitte) → Austritt.
 * Gerade/diagonale Zellen verbinden zwei Rand-/Eckpunkte; Eckzellen
 * (Eingang anderes als Ausgang) laufen über die Zellmitte.
 */
export function beltPathPoints(b, lat = 0) {
  const din = entryDirOf(b);
  const dout = b.dir;
  const a = edgePoint(b, din, lat, false);
  const e = edgePoint(b, dout, lat, true);
  if (din === dout) return [a, e];
  const cx = (b.x + b.spanW / 2) * CELL;
  const cy = (b.y + b.spanH / 2) * CELL;
  return [a, { x: cx, y: cy }, e];
}

export const polylineLength = (pts) => {
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  return len;
};

/** Punkt bei Parameter `t` (0..1) entlang einer Polylinie, nach Bogenlänge. */
export function pointAlongPolyline(pts, t) {
  const total = polylineLength(pts);
  if (total <= 0) return { ...pts[pts.length - 1] };
  let d = Math.max(0, Math.min(1, t)) * total;
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (d <= seg || i === pts.length - 1) {
      const k = seg > 0 ? d / seg : 0;
      return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * k, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * k };
    }
    d -= seg;
  }
  return { ...pts[pts.length - 1] };
}

export const lenOf = (b) => polylineLength(beltPathPoints(b));

export function itemPos(b, it) {
  if (it.p == null) return { x: (b.x + b.spanW / 2) * CELL, y: (b.y + b.spanH / 2) * CELL };
  return pointAlongPolyline(beltPathPoints(b, it.lat || 0), it.p);
}

export function exitCellOf(b, d, lat) {
  if (d === 0) return { x: b.x + b.spanW, y: b.y + lat };
  if (d === 2) return { x: b.x - 1, y: b.y + lat };
  if (d === 1) return { x: b.x + lat, y: b.y + b.spanH };
  if (d === 3) return { x: b.x + lat, y: b.y - 1 };
  const sx = DX[d],
    sy = DY[d];
  return { x: b.x + (sx > 0 ? b.spanW : -1), y: b.y + (sy > 0 ? b.spanH : -1) };
}

export const latOf = (b, d, cell) => {
  if (!isDiag(d)) return d & 1 ? cell.x - b.x : cell.y - b.y;
  // Diagonaler Eingang: Spur an der Achse des naheliegenden Maschinen-Ports ausrichten.
  const ports = portsOf(b);
  const ax = (ports.in[0] ?? ports.out[0] ?? 0) & 1;
  const v = ax ? cell.x - b.x : cell.y - b.y;
  return Math.max(0, Math.min((ax ? b.spanW : b.spanH) - 1, v));
};

/** Platz am Ende einer Warteschlange? */
export function roomIn(t) {
  const last = t.items[t.items.length - 1];
  if (!last) return true;
  if (last.p == null) return t.items.length < (DEF[t.t].cap || 3);
  return last.p >= MIN_GAP;
}

/**
 * Nimmt das Gebäude eine Ware aus Bewegungsrichtung `d` an?
 * Diagonale Eingänge zählen als beide orthogonalen Anteile.
 */
const accepts = (t, d) => {
  const ins = portsOf(t).in;
  if (ins.includes(d)) return true;
  return isDiag(d) && compsOf(d).some((c) => ins.includes(c));
};

/**
 * Ware in ein Zielgebäude einspeisen.
 * @param {object} t Zielgebäude
 * @param {object} it Ware
 * @param {number} d Bewegungsrichtung der Ware (absolut)
 * @param {object} entry Zelle, in die die Ware hineinläuft
 */
export function feed(t, it, d, entry) {
  const def = DEF[t.t];
  if (t.on === false && def.kind !== 'sink') return false;
  if (def.kind === 'sink') {
    if (t.items.length >= (def.cap || 3)) return false;
    it.p = 0;
    it.lat = 0;
    it.prog = 0;
    t.items.push(it);
    return true;
  }
  if (def.kind === 'route') {
    if (!accepts(t, d)) return false;
    if (t.items.length >= (def.cap || 3)) return false;
    it.p = null;
    it.held = false;
    t.items.push(it);
    return true;
  }
  if (def.kind === 'pass') {
    if (!accepts(t, d)) return false;
    if (!roomIn(t)) return false;
    it.lat = latOf(t, d, entry);
    it.p = 0;
    it.prog = 0;
    it.held = !!def.cut;
    t.items.push(it);
    return true;
  }
  return false;
}

/** Ware fallen lassen (kein Ziel unter dem Band). */
function dropItem(b, it, d) {
  const pos = edgePoint(b, d, it.lat || 0, true);
  const sp = beltSpeed();
  const obj = {
    ...it,
    x: pos.x + DX[d] * 6,
    y: pos.y + DY[d] * 6,
    vx: DX[d] * sp * 0.7,
    vy: DY[d] * sp * 0.7 - 30,
    rot: it.rot || 0,
    spin: (rnd() - 0.5) * 4,
    state: 'fall',
    p: undefined,
    lat: undefined,
    held: undefined,
    prog: undefined,
  };
  if (it.kind === 'stick') sticks.push(obj);
  else corpses.push(obj);
}

/**
 * Ware am Ende der Kette übergeben: Band → Band/Maschine, sonst fallen.
 * @returns {boolean} true, wenn die Ware das Gebäude verlassen hat
 */
export function tryHandoff(b, it) {
  const d = portsOf(b).out[0] ?? b.dir;
  const c = exitCellOf(b, d, it.lat || 0);
  if (!inGrid(c.x, c.y)) {
    S.stats.escaped++;
    return true;
  }
  const target = bldAtCell(c.x, c.y);
  if (!target) {
    dropItem(b, it, d);
    return true;
  }
  if (target === b) return false;
  const kind = DEF[target.t].kind;
  if (kind === 'belt') {
    if (!roomIn(target)) return false;
    target.items.push({ ...it, p: 0, lat: 0, held: false });
    return true;
  }
  return feed(target, it, d, c);
}

/**
 * Waren in einem Gebäude bewern (Band, Durchlauf-Maschine).
 * @param {(it: object, i: number, dt: number) => void} work Fortschritts-Callback
 */
export function stepTransport(b, dt, work) {
  const items = b.items;
  if (work) {
    for (let i = 0; i < items.length; i++) {
      if (!items[i].held) continue;
      const removed = work(items[i], i, dt);
      if (removed) {
        items.splice(i, 1);
        i--;
      }
    }
  }
  const len = lenOf(b);
  const dp = (beltSpeed() * dt * (b.on === false ? 0 : 1)) / Math.max(1, len);
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (it.p == null || it.held) continue;
    if (i === 0) {
      it.p = Math.min(1, it.p + dp);
      continue;
    }
    const ahead = items[i - 1];
    if (ahead.p == null) continue;
    const cap = ahead.p - MIN_GAP;
    if (cap <= it.p) continue;
    it.p = Math.min(cap, it.p + dp);
  }
  let guard = 0;
  while (items.length && items[0].p != null && items[0].p >= 1 - 1e-9 && guard++ < 12) {
    if (!tryHandoff(b, items[0])) break;
    items.shift();
  }
}
