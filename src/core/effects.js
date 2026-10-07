import { CELL, GRID_H, GRID_W, PH, PW } from '../config/constants.js';
import { idx } from './grid.js';
import { S, beltBlood, floorBlood, occ, parts } from './state.js';
import { $, rnd } from '../utils/helpers.js';

/* Effekte */
let _reduced;
/** Systemeinstellung "Bewegung reduzieren" (in Node ohne matchMedia: false). */
export function reducedMotion() {
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
  S.gore === 0 ? '#36424f' : S.gore === 50 ? '#8e2a22' : '#cf3020';
export const nBurst = (a) =>
  S.gore === 0 ? 3 : S.gore === 50 ? Math.ceil(a * 0.6) : a;

export const addBeltBlood = (x, y, a) => {
  if (x < 0 || y < 0 || x >= GRID_W || y >= GRID_H) return;
  const i = idx(x, y);
  beltBlood[i] = Math.min(9, beltBlood[i] + a);
};
export const addFloorBlood = (x, y, a) => {
  if (x < 0 || y < 0 || x >= GRID_W || y >= GRID_H) return;
  const i = idx(x, y);
  floorBlood[i] = Math.min(11, floorBlood[i] + a);
};

/**
 * Blut bewegt sich: Bandblut tropft auf den Boden, Bodenblut sickert
 * nach unten, bis es auf ein Gebäude trifft, und breitet sich dann seitlich aus.
 */
export function fluids(dt) {
  const n = GRID_W * GRID_H;
  for (let i = 0; i < n; i++) {
    const b0 = beltBlood[i];
    if (b0 > 0.001) {
      const dr = Math.min(b0, b0 * dt * 0.55 + dt * 0.02);
      beltBlood[i] -= dr;
      floorBlood[i] = Math.min(11, floorBlood[i] + dr);
    }
    if (beltBlood[i] > 0) beltBlood[i] = Math.max(0, beltBlood[i] - dt * 0.05);
  }
  const down = 46 * dt,
    side = 15 * dt;
  for (let y = GRID_H - 1; y >= 0; y--) {
    for (let x = 0; x < GRID_W; x++) {
      const i = idx(x, y);
      let v = floorBlood[i] - dt * 0.03;
      if (v <= 0.002) {
        floorBlood[i] = Math.max(0, v);
        continue;
      }
      const below = y + 1 < GRID_H ? idx(x, y + 1) : -1;
      if (below >= 0 && occ[below] <= 0) {
        const q = Math.min(v, down);
        v -= q;
        floorBlood[below] = Math.min(11, floorBlood[below] + q);
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
    color: 'rgba(92,110,132,.5)',
    size: 1 + rnd() * 1.2,
    grav: 0,
  });
}

export const worldW = () => PW;
export const worldH = () => PH;
export const cellOf = (x, y) => Math.floor(x / CELL) + Math.floor(y / CELL) * GRID_W;
