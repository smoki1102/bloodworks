import { DEF } from '../config/building-defs.js';
import { BELT_H, BELT_Y, CELL, COLS, KELLER_FLOOR, OBEN_FLOOR } from '../config/constants.js';
import { toast } from './effects.js';
import { S, blds, nextId, occ, takeId } from './state.js';
import { colX, hash } from '../utils/helpers.js';

export const countOf = (t) => blds.filter((b) => b.t === t).length,
  has = (t) => countOf(t) > 0;
export function canPlace(t, col) {
  return placeReason(t, col) === null;
}
/** Grund, warum der Bau an col nicht möglich ist – oder null. */
export function placeReason(t, col) {
  const d = DEF[t];
  if (!d || col < 0 || col + d.w > COLS) return 'Außerhalb der Fabrik';
  for (let c = col; c < col + d.w; c++) {
    if (occ[d.band][c]) return 'Blockiert';
    if (d.band === 'over' && !occ.belt[c]) return 'Braucht Band darunter';
  }
  if (d.max && countOf(t) >= d.max) return 'Nur ' + d.max + ' erlaubt';
  if (S.money < d.cost) return 'Zu teuer: ' + d.cost + ' €';
  return null;
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
    on: true,
    buf: 0,
    link: '-',
    util: 0,
    rate: 0,
    outCount: 0,
    lastOut: null,
    pullCd: 0,
    pulse: 0,
    worked: false,
  };
  blds.push(b);
  for (let c = col; c < col + d.w; c++) occ[d.band][c] = b.id;
  if (!free) pushHistory(true, b);
  return b;
}
export function removeBuilding(b) {
  const d = DEF[b.t];
  for (let c = b.col; c < b.col + b.w; c++) if (occ[d.band][c] === b.id) occ[d.band][c] = 0;
  blds.splice(blds.indexOf(b), 1);
  if (S.sel === b) S.sel = null;
}
export function sellBuilding(b) {
  pushHistory(false, b);
  const r = Math.round(DEF[b.t].cost * 0.5);
  S.money += r;
  removeBuilding(b);
  toast('Verkauft · +' + r + ' €');
}

/* Rückgängig machen */
export const history = [];
export function pushHistory(add, b) {
  history.push({
    add,
    cost: DEF[b.t].cost,
    snap: {
      id: b.id,
      t: b.t,
      col: b.col,
      dirt: b.dirt,
      on: b.on !== false,
      buf: b.buf,
      items: b.items.map((i) => ({ rot: i.rot, kind: i.kind, part: i.part })),
    },
  });
  if (history.length > 64) history.shift();
}
export function clearHistory() {
  history.length = 0;
}
export function undo() {
  const h = history.pop();
  if (!h) return toast('Nichts rückgängig zu machen', 'bad');
  if (h.add) {
    const b = blds.find((x) => x.id === h.snap.id);
    if (b) removeBuilding(b);
    S.money += h.cost;
    toast('Rückgängig: ' + DEF[h.snap.t].n, 'good');
  } else {
    const b = addBuilding(h.snap.t, h.snap.col, true);
    if (!b) return toast('Kein Platz mehr zum Wiederherstellen', 'bad');
    b.dirt = h.snap.dirt;
    b.on = h.snap.on;
    b.buf = h.snap.buf;
    b.items = h.snap.items;
    S.money -= Math.round(h.cost * 0.5);
    toast('Verkauf rückgängig · +' + DEF[h.snap.t].n, 'good');
  }
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
