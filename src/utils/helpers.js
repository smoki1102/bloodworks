import { CELL, X0 } from '../config/constants.js';

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const $ = (id) => document.getElementById(id);
export const colAt = (x) => Math.floor((x - X0) / CELL),
  colX = (c) => X0 + c * CELL,
  colCX = (c) => X0 + c * CELL + CELL / 2;
export let _seed = 12345;
export const rnd = () => {
  _seed = (_seed * 1664525 + 1013904223) >>> 0;
  return _seed / 4294967296;
};
export const hash = (i) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const fmt = (n) => {
  n = Math.floor(n);
  return n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e4 ? (n / 1e3).toFixed(1) + 'k' : '' + n;
};
