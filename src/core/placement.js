import { DEF } from '../config/building-defs.js';
import { BELT_H, BELT_Y, CELL, COLS, KELLER_FLOOR, OBEN_FLOOR } from '../config/constants.js';
import { toast } from './effects.js';
import { S, blds, nextId, occ, takeId } from './state.js';
import { colX, hash } from '../utils/helpers.js';

export const countOf = (t) => blds.filter((b) => b.t === t).length,
  has = (t) => countOf(t) > 0;
export function canPlace(t, col) {
  const d = DEF[t];
  if (!d || col < 0 || col + d.w > COLS) return false;
  for (let c = col; c < col + d.w; c++) {
    if (occ[d.band][c]) return false;
    if (d.band === 'over' && !occ.belt[c]) return false;
  }
  return !(d.max && countOf(t) >= d.max);
}
export function addBuilding(t, col, free) {
  const d = DEF[t];
  if (!canPlace(t, col) || (!free && S.money < d.cost)) return null;
  if (!free) S.money -= d.cost;
  const b = {
    id: takeId(),
    t,
    col,
    w: d.w,
    dirt: 0,
    clean: 0,
    prog: 0,
    phase: hash(nextId) * 1.4,
    items: [],
    glow: 0,
  };
  blds.push(b);
  for (let c = col; c < col + d.w; c++) occ[d.band][c] = b.id;
  return b;
}
export function removeBuilding(b) {
  const d = DEF[b.t];
  for (let c = b.col; c < b.col + b.w; c++) if (occ[d.band][c] === b.id) occ[d.band][c] = 0;
  blds.splice(blds.indexOf(b), 1);
  if (S.sel === b) S.sel = null;
}
export function sellBuilding(b) {
  const r = Math.round(DEF[b.t].cost * 0.5);
  S.money += r;
  removeBuilding(b);
  toast('Verkauft · +' + r + ' €');
}
export function bldRect(b) {
  const d = DEF[b.t],
    x = colX(b.col),
    w = d.w * CELL;
  if (d.band === 'belt') return { x, y: BELT_Y, w, h: BELT_H };
  if (d.band === 'keller') return { x, y: KELLER_FLOOR - d.h, w, h: d.h };
  if (d.band === 'oben') return { x, y: OBEN_FLOOR - d.h, w, h: d.h };
  return { x, y: BELT_Y - d.h, w, h: d.h };
}
export function bldAt(wx, wy) {
  for (let i = blds.length - 1; i >= 0; i--) {
    const r = bldRect(blds[i]);
    if (wx >= r.x && wx < r.x + r.w && wy >= r.y && wy < r.y + r.h) return blds[i];
  }
  return null;
}
