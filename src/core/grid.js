import { CELL, DX, DY, GRID_H, GRID_W } from '../config/constants.js';
import { DEF } from '../config/building-defs.js';
import { S, blds, bmap, occ } from './state.js';

export const idx = (x, y) => y * GRID_W + x;
export const inGrid = (x, y) => x >= 0 && y >= 0 && x < GRID_W && y < GRID_H;
export const cellX = (x) => x * CELL;
export const cellY = (y) => y * CELL;
export const cellAt = (wx, wy) => ({
  x: Math.floor(wx / CELL),
  y: Math.floor(wy / CELL),
});

/** Belegtes Feld -> Gebäude oder null. */
export function bldAtCell(x, y) {
  if (!inGrid(x, y)) return null;
  const id = occ[idx(x, y)];
  return id ? bmap.get(id) || null : null;
}

export function bldRect(b) {
  const w = (b.spanW || DEF[b.t].w) * CELL;
  const h = (b.spanH || DEF[b.t].h) * CELL;
  return { x: b.x * CELL, y: b.y * CELL, w, h };
}

export function bldAt(wx, wy) {
  const c = cellAt(wx, wy);
  return bldAtCell(c.x, c.y);
}

export function inRect(b, x, y) {
  return (
    x >= b.x &&
    y >= b.y &&
    x < b.x + (b.spanW || DEF[b.t].w) &&
    y < b.y + (b.spanH || DEF[b.t].h)
  );
}

export function eachCell(b, cb) {
  const w = b.spanW || DEF[b.t].w,
    h = b.spanH || DEF[b.t].h;
  for (let y = b.y; y < b.y + h; y++)
    for (let x = b.x; x < b.x + w; x++) cb(x, y);
}

/** Zelle außerhalb des Gebäudes in Richtung `d` – Start der Ausgangskante. */
export function exitCell(b, d) {
  const w = b.spanW || DEF[b.t].w,
    h = b.spanH || DEF[b.t].h;
  let cx, cy;
  if (d === 0) {
    cx = b.x;
    cy = b.y + ((h - 1) >> 1);
  } else if (d === 2) {
    cx = b.x + w - 1;
    cy = b.y + ((h - 1) >> 1);
  } else if (d === 1) {
    cy = b.y + h - 1;
    cx = b.x + ((w - 1) >> 1);
  } else {
    cy = b.y;
    cx = b.x + ((w - 1) >> 1);
  }
  while (inRect(b, cx + DX[d], cy + DY[d])) {
    cx += DX[d];
    cy += DY[d];
  }
  return { x: cx + DX[d], y: cy + DY[d] };
}

/** Ports eines Gebäudes in absoluten Richtungen. */
export function portsOf(b) {
  const d = DEF[b.t];
  if (b.t === 'belt') return { in: [b.fromDir ?? b.dir], out: [b.dir] };
  const dir = b.dir ?? 0;
  const abs = (rels) => (rels || []).map((r) => (dir + r + 4) & 3);
  return { in: abs(d.in), out: abs(d.out) };
}

/** Senkrecht zur Baurichtung, umklappend. */
export const perpOf = (b, side) => ((b.dir ?? 0) + side + 4) & 3;

/** Boden unter einer Koordinate: erste Stütze (Gebäude ohne Band/Pipe) oder Weltboden. */
export function supportBelow(x, y) {
  for (let cy = y; cy < GRID_H; cy++) {
    const b = bldAtCell(x, cy);
    if (b) {
      const k = DEF[b.t].kind;
      if (k !== 'belt' && k !== 'pipe') return { x, y: cy, bld: b };
    }
  }
  return { x, y: GRID_H - 1, bld: bldAtCell(x, GRID_H - 1) };
}

export const worldWidth = () => GRID_W * CELL;
export const worldHeight = () => GRID_H * CELL;

/** Sichtbare Zellen für Culling – die Kamera steht in der Bildmitte. */
export function viewCells(cam, vw, vh) {
  const hw = vw / (2 * (cam.z || 1));
  const hh = vh / (2 * (cam.z || 1));
  const x0 = Math.max(0, Math.floor((cam.x - hw) / CELL));
  const y0 = Math.max(0, Math.floor((cam.y - hh) / CELL));
  const x1 = Math.min(GRID_W, Math.ceil((cam.x + hw) / CELL) + 1);
  const y1 = Math.min(GRID_H, Math.ceil((cam.y + hh) / CELL) + 1);
  return { x0, y0, x1, y1 };
}

export const visibleRect = (b, cam, vw, vh) => {
  const r = bldRect(b);
  const hw = vw / (2 * (cam.z || 1));
  const hh = vh / (2 * (cam.z || 1));
  return (
    r.x + r.w >= cam.x - hw - CELL &&
    r.x <= cam.x + hw + CELL &&
    r.y + r.h >= cam.y - hh - CELL &&
    r.y <= cam.y + hh + CELL
  );
};

export const countOf = (t) => blds.filter((b) => b.t === t).length;
export const has = (t) => countOf(t) > 0;
export const selOf = () => S.sel;
