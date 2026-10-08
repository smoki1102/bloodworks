export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const $ = (id) => document.getElementById(id);
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
  if (n >= 999950) return (n / 1e6).toFixed(1).replace('.', ',') + 'M';
  if (n >= 1e4)
    return (
      (n / 1e3).toFixed(1).replace(/\.0$/, '').replace('.', ',') + 'k'
    );
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};
