import { CELL, GRID_H, GRID_W, PH, PW } from '../config/constants.js';
import { CANVAS } from '../config/palette.js';
import { idx } from './grid.js';
import { suckNet } from './pipes.js';
import { nets, S, beltBlood, floorBlood, occ, parts } from './state.js';
import { $, rnd } from '../utils/helpers.js';

/* Effekte */
let _reduced;
let _motionOverride = null;
/** Explizite Nutzerentscheidung (Einstellungs-Popover); `null` = Systemwert. */
export function setReducedMotion(on) {
  _motionOverride = on === null ? null : !!on;
}
/** Systemeinstellung "Bewegung reduzieren" (in Node ohne matchMedia: false). */
export function reducedMotion() {
  if (_motionOverride !== null) return _motionOverride;
  if (_reduced === undefined)
    _reduced =
      typeof matchMedia === 'function' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches;
  return _reduced;
}
export function burst(x, y, c, n, sp) {
  if (reducedMotion()) n = Math.max(1, Math.round(n * 0.35));
  for (let i = 0; i < n; i++)
    parts.push({
      x,
      y,
      vx: (rnd() - 0.5) * (sp || 170),
      vy: -40 - rnd() * 150,
      life: 0.35 + rnd() * 0.7,
      max: 1,
      color: c,
      size: 2 + rnd() * 2.5,
      grav: 1,
    });
}
export function floatText(x, y, t, c) {
  parts.push({
    x,
    y,
    vx: 0,
    vy: -36,
    life: 1.2,
    max: 1.2,
    color: c,
    text: t,
    grav: 0,
  });
}
export function toast(msg, kind) {
  if (typeof document === 'undefined') return;
  const el = document.createElement('div');
  el.className = 'toast ' + (kind || '');
  el.textContent = msg;
  $('toasts').appendChild(el);
  setTimeout(() => el.remove(), 2400);
}
export const bloodColor = () =>
  S.gore === 0 ? CANVAS.blood0 : S.gore === 50 ? CANVAS.blood50 : CANVAS.blood100;
export const nBurst = (a) =>
  S.gore === 0 ? 3 : S.gore === 50 ? Math.ceil(a * 0.6) : a;

/* Schmutz-Rechteck: Zellen, die (noch) Blut enthalten könnten. Wird von den
 * add*-Helfern expandiert und in fluids() pro Tick neu verengt – spart das
 * zweimalige Scannen aller 8192 Zellen. */
let bMinX = 1,
  bMinY = 1,
  bMaxX = 0,
  bMaxY = 0;
const touch = (x, y) => {
  if (x < bMinX) bMinX = x;
  if (y < bMinY) bMinY = y;
  if (x > bMaxX) bMaxX = x;
  if (y > bMaxY) bMaxY = y;
};

/** Nach initSim(): Blut-Arrays sind leer, Bounds zurücksetzen. */
export function resetBloodBounds() {
  bMinX = 1;
  bMinY = 1;
  bMaxX = 0;
  bMaxY = 0;
}

export const addBeltBlood = (x, y, a) => {
  if (x < 0 || y < 0 || x >= GRID_W || y >= GRID_H) return;
  const i = idx(x, y);
  beltBlood[i] = Math.min(9, beltBlood[i] + a);
  touch(x, y);
};
export const addFloorBlood = (x, y, a) => {
  if (x < 0 || y < 0 || x >= GRID_W || y >= GRID_H) return;
  const i = idx(x, y);
  floorBlood[i] = Math.min(11, floorBlood[i] + a);
  touch(x, y);
};

/**
 * Blut bewegt sich: Bandblut tropft auf den Boden – außer die Zelle grenzt an
 * ein angeschlossenes Pipe-Netz, dann wird es dort eingesaugt (kein Tropfen).
 * Bodenblut sickert nach unten, bis es auf ein Gebäude trifft, und breitet
 * sich dann seitlich aus. Iteration nur über das Schmutz-Rechteck.
 */
export function fluids(dt) {
  if (bMaxX < bMinX) return; // kein aktives Blut
  const x0 = bMinX,
    y0 = bMinY,
    x1 = bMaxX,
    y1 = bMaxY;
  bMinX = 1;
  bMinY = 1;
  bMaxX = 0;
  bMaxY = 0;
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const i = idx(x, y);
      const b0 = beltBlood[i];
      if (b0 > 0.001) {
        touch(x, y);
        const dr = Math.min(b0, b0 * dt * 0.55 + dt * 0.02);
        const netId = suckNet[i];
        const net = netId >= 0 ? nets[netId] : null;
        if (net) {
          const take = Math.min(dr, Math.max(0, net.cap - net.v));
          net.v += take;
          beltBlood[i] -= take;
        } else {
          beltBlood[i] -= dr;
          floorBlood[i] = Math.min(11, floorBlood[i] + dr);
        }
      }
      if (beltBlood[i] > 0) {
        beltBlood[i] = Math.max(0, beltBlood[i] - dt * 0.05);
        if (beltBlood[i] > 0) touch(x, y);
      }
    }
  const down = 46 * dt,
    side = 15 * dt;
  for (let y = y1; y >= y0; y--) {
    for (let x = x0; x <= x1; x++) {
      const i = idx(x, y);
      let v = floorBlood[i] - dt * 0.03;
      if (v <= 0.002) {
        floorBlood[i] = Math.max(0, v);
        continue;
      }
      touch(x, y);
      const below = y + 1 < GRID_H ? idx(x, y + 1) : -1;
      if (below >= 0 && occ[below] <= 0) {
        const q = Math.min(v, down);
        v -= q;
        floorBlood[below] = Math.min(11, floorBlood[below] + q);
        touch(x, y + 1);
        floorBlood[i] = v;
        continue;
      }
      floorBlood[i] = v;
      const half = Math.min(v, side) / 2;
      if (half < 0.002) continue;
      for (const dx of [-1, 1]) {
        const nx = x + dx;
        if (nx < 0 || nx >= GRID_W) continue;
        const j = idx(nx, y);
        if (occ[j] > 0) continue;
        const room = 11 - floorBlood[j];
        if (room <= 0.01) continue;
        const q = Math.min(half, room);
        floorBlood[i] -= q;
        floorBlood[j] += q;
        touch(nx, y);
      }
    }
  }
}

/** Staub in der sichtbaren Halle – rein visuell. */
let dustT = 0;
export function ambient(dt) {
  if (!S.running || reducedMotion()) return;
  dustT -= dt;
  if (dustT > 0) return;
  dustT = 0.3 + rnd() * 0.5;
  if (parts.length > 90) return;
  const cam = S.cam;
  const life = 5 + rnd() * 4;
  parts.push({
    x: cam.x + rnd() * 1400,
    y: cam.y + rnd() * 900,
    vx: -3 - rnd() * 5,
    vy: -1 - rnd() * 3,
    life,
    max: life,
    color: CANVAS.dust,
    size: 1 + rnd() * 1.2,
    grav: 0,
  });
}

export const worldW = () => PW;
export const worldH = () => PH;
export const cellOf = (x, y) => Math.floor(x / CELL) + Math.floor(y / CELL) * GRID_W;
