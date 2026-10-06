import { COLS } from '../config/constants.js';
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
  parts.push({ x, y, vx: 0, vy: -36, life: 1.2, max: 1.2, color: c, text: t, grav: 0 });
}
export function toast(msg, kind) {
  const el = document.createElement('div');
  el.className = 'toast ' + (kind || '');
  el.textContent = msg;
  $('toasts').appendChild(el);
  setTimeout(() => el.remove(), 2400);
}
export const bloodColor = () => (S.gore === 0 ? '#666' : S.gore === 50 ? '#8e2a22' : '#d63a2c');
export const nBurst = (a) => (S.gore === 0 ? 3 : S.gore === 50 ? Math.ceil(a * 0.6) : a);

export const addBeltBlood = (x, a) => {
  const c = colAt(x);
  if (c >= 0 && c < COLS) beltBlood[c] = Math.min(9, beltBlood[c] + a);
};
export const addFloorBlood = (x, a) => {
  const c = colAt(x);
  if (c >= 0 && c < COLS) floorBlood[c] = Math.min(11, floorBlood[c] + a);
};
