import { DEF } from '../config/building-defs.js';
import { DX, DY, GRID_H, GRID_W, isDiag, opp, rotL, rotR } from '../config/constants.js';
import { toast } from './effects.js';
import { bldAtCell, eachCell, idx, inGrid } from './grid.js';
import { S, blds, bmap, occ, takeId } from './state.js';
import { hash } from '../utils/helpers.js';

export const costOf = (t) => Math.round(DEF[t].cost * (S.fx?.buildCost ?? 1));
const w0 = (t) => DEF[t].w;
export const cleanCostOf = (b) =>
  Math.round((15 + b.dirt * 0.8) * (S.fx?.cleanCost ?? 1));

export const isUnlocked = (t) => {
  const u = DEF[t].unlock;
  if (!u) return true;
  return (Array.isArray(u) ? u : [u]).every((id) => (S.skill?.lv[id] || 0) > 0);
};

/** Ursprung (oben links) eines Baus, der zentriert auf die Zelle (cx,cy) kommt. */
export function originOf(t, cx, cy) {
  const d = DEF[t];
  return { x: cx - ((d.w - 1) >> 1), y: cy - ((d.h - 1) >> 1) };
}

/** Alle Zellen des geplanten Baus frei und in der Welt? */
function freeCells(t, x, y, w, h) {
  if (x < 0 || y < 0 || x + w > GRID_W || y + h > GRID_H) return 'Außerhalb der Fabrik';
  for (let cy = y; cy < y + h; cy++)
    for (let cx = x; cx < x + w; cx++) if (occ[idx(cx, cy)]) return 'Blockiert';
  return null;
}

/** Passt eine Bandrichtung? Kein Ping-Pong mit einem Nachbarband. */
export function dirOk(x, y, d) {
  const nx = x + DX[d],
    ny = y + DY[d];
  const n = bldAtCell(nx, ny);
  if (n && n.t === 'belt' && n.dir === opp(d)) return false;
  return true;
}

/** Automatische Bandrichtung aus den Nachbarn (auch diagonal). */
export function autoDir(x, y, preferred = 0) {
  const inputs = [];
  for (let d = 0; d < 8; d++) {
    const n = bldAtCell(x + DX[d], y + DY[d]);
    if (n && n.t === 'belt' && n.dir === opp(d)) inputs.push(n.dir);
  }
  const base = inputs.length === 1 ? inputs[0] : preferred;
  if (isDiag(base)) return dirOk(x, y, base) ? base : preferred;
  for (const d of [base, rotR(base), rotL(base), opp(base)]) if (dirOk(x, y, d)) return d;
  return base;
}

/**
 * Grund, warum der Bau an (x,y) nicht möglich ist – oder null.
 * `d` ist die Baurichtung.
 */
export function placeReason(t, x, y, d = 0) {
  const def = DEF[t];
  if (!def) return 'Unbekannt';
  if (!isUnlocked(t)) return 'Im Skill-Tree freizuschalten';
  const bad = freeCells(t, x, y, def.w, def.h);
  if (bad) return bad;
  if (t === 'belt' && !dirOk(x, y, d)) return 'Schleifenbildung';
  if (S.money < costOf(t)) return 'Zu teuer: ' + costOf(t) + ' €';
  return null;
}

export const canPlace = (t, x, y, d = 0) => placeReason(t, x, y, d) === null;

export function addBuilding(t, x, y, opts = {}) {
  const def = DEF[t];
  const d = opts.dir ?? 0;
  const h = def.h;
  if (!opts.free) {
    const reason = placeReason(t, x, y, d);
    if (reason) {
      if (!opts.silent) toast(reason, 'bad');
      return null;
    }
    S.money -= costOf(t);
  } else {
    for (let cy = y; cy < y + h; cy++)
      for (let cx = x; cx < x + w0(t); cx++) {
        if (cx < 0 || cy < 0 || cx >= GRID_W || cy >= GRID_H) return null;
        if (occ[idx(cx, cy)]) return null;
      }
  }
  const id = takeId();
  const b = {
    id,
    t,
    x,
    y,
    spanW: w0(t),
    spanH: h,
    dir: d,
    fromDir: opts.fromDir ?? d,
    flip: false,
    netId: -1,
    dirt: 0,
    clean: 0,
    prog: 0,
    phase: hash(id) * 1.4,
    items: [],
    queue: [],
    glow: 0,
    on: true,
    buf: 0,
    link: '-',
    util: 0,
    rate: 0,
    outCount: 0,
    lastOut: null,
    pulse: 0,
    worked: false,
    hitAt: {},
    target: '',
    filter: { by: 'part', val: 'head' },
    reserve: null,
    reserveTouched: false,
    soldPulse: 0,
  };
  blds.push(b);
  bmap.set(id, b);
  eachCell(b, (cx, cy) => (occ[idx(cx, cy)] = id));
  markDirty();
  if (!opts.free) pushHistory(true, b, costOf(t));
  return b;
}

export function removeBuilding(b) {
  eachCell(b, (cx, cy) => {
    if (occ[idx(cx, cy)] === b.id) occ[idx(cx, cy)] = 0;
  });
  bmap.delete(b.id);
  blds.splice(blds.indexOf(b), 1);
  markDirty();
  if (S.sel === b) S.sel = null;
}

export function sellBuilding(b) {
  pushHistory(false, b, Math.round(costOf(b.t) * 0.5));
  const r = Math.round(costOf(b.t) * 0.5);
  S.money += r;
  removeBuilding(b);
  toast('Verkauft · +' + r + ' €', 'good');
}

function markDirty() {
  // Auch Bänder/Maschinen ändern die Absaugung ihrer Nachbarschaft.
  S.netDirty = true;
}

/* Rückgängig machen */
export const history = [];
export function pushHistory(add, b, amount) {
  history.push({
    add,
    cost: amount,
    snap: {
      id: b.id,
      t: b.t,
      x: b.x,
      y: b.y,
      spanW: b.spanW,
      spanH: b.spanH,
      dir: b.dir,
      fromDir: b.fromDir,
      flip: b.flip,
      dirt: b.dirt,
      on: b.on !== false,
      buf: b.buf,
      target: b.target,
      filter: { ...b.filter },
      reserve: b.reserve ? { ...b.reserve } : null,
      reserveTouched: b.reserveTouched,
      items: b.items.map((i) => ({ rot: i.rot, kind: i.kind, part: i.part })),
    },
  });
  if (history.length > 64) history.shift();
}
export function clearHistory() {
  history.length = 0;
}

/** Eine Rückgängig-Einheit für mehrere Gebäude (Bandstrecke). */
export function pushGroup(add, list, amount) {
  history.push({
    add,
    cost: amount,
    multi: list.map((b) => ({ id: b.id, t: b.t })),
  });
  if (history.length > 64) history.shift();
}

export function undo() {
  const h = history.pop();
  if (!h) return toast('Nichts rückgängig zu machen', 'bad');
  if (h.multi) {
    let n = 0;
    for (const m of h.multi) {
      const b = bmap.get(m.id);
      if (b) {
        removeBuilding(b);
        n++;
      }
    }
    S.money += h.cost;
    toast('Rückgängig: Bandstrecke (' + n + ' Zellen)', 'good');
    return;
  }
  if (h.add) {
    const b = bmap.get(h.snap.id);
    if (b) removeBuilding(b);
    S.money += h.cost;
    toast('Rückgängig: ' + DEF[h.snap.t].n, 'good');
  } else {
    const b = addBuilding(h.snap.t, h.snap.x, h.snap.y, {
      free: true,
      dir: h.snap.dir,
      fromDir: h.snap.fromDir,
    });
    if (!b) return toast('Kein Platz mehr zum Wiederherstellen', 'bad');
    b.dirt = h.snap.dirt;
    b.on = h.snap.on;
    b.buf = h.snap.buf;
    b.items = h.snap.items;
    b.target = h.snap.target;
    b.filter = h.snap.filter;
    b.reserve = h.snap.reserve;
    b.reserveTouched = h.snap.reserveTouched;
    S.money -= h.cost;
    toast('Verkauf rückgängig · ' + DEF[h.snap.t].n, 'good');
  }
}

/** Wasserzeichen für die Leerraum-Bauvorschau. */
export const ghostCells = (t, x, y, d) => {
  const def = DEF[t];
  const out = [];
  for (let cy = y; cy < y + def.h; cy++)
    for (let cx = x; cx < x + def.w; cx++) if (inGrid(cx, cy)) out.push([cx, cy]);
  return { cells: out, d };
};
