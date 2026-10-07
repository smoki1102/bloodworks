import { BELT_Y, COLS, OBEN_FLOOR, PW, X0 } from '../config/constants.js';
import { S, beltBlood, floorBlood, parts } from './state.js';
import { $, colAt, rnd } from '../utils/helpers.js';

/* Effekte */
export function burst(x, y, c, n, sp) {
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

export const addBeltBlood = (x, a) => {
  const c = colAt(x);
  if (c >= 0 && c < COLS) beltBlood[c] = Math.min(9, beltBlood[c] + a);
};
export const addFloorBlood = (x, a) => {
  const c = colAt(x);
  if (c >= 0 && c < COLS) floorBlood[c] = Math.min(11, floorBlood[c] + a);
};

/** Staub in der Halle – rein visuell, ändert keinen Spielzustand. */
let dustT = 0;
export function ambient(dt) {
  if (!S.running) return;
  dustT -= dt;
  if (dustT > 0) return;
  dustT = 0.3 + rnd() * 0.5;
  if (parts.length > 80) return;
  const life = 5 + rnd() * 4;
  parts.push({
    x: X0 + 8 + rnd() * (PW - 16),
    y: OBEN_FLOOR + 26 + rnd() * (BELT_Y - OBEN_FLOOR - 44),
    vx: -3 - rnd() * 5,
    vy: -1 - rnd() * 3,
    life,
    max: life,
    color: 'rgba(92,110,132,.5)',
    size: 1 + rnd() * 1.2,
    grav: 0,
  });
}
