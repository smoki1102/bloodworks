import { DEF } from '../config/building-defs.js';
import { GRID_H, GRID_W } from '../config/constants.js';
import { idx } from './grid.js';
import { addBuilding, costOf, isUnlocked, pushGroup, removeBuilding } from './placement.js';
import { S, blds, occ } from './state.js';

/**
 * Baupläne („Blueprints"): einen Bereich markieren, kopieren und woanders
 * gesammelt wieder einsetzen. Reine Daten – Auflösung der Zellen, Kosten,
 * Besetzungs- und Freischaltungsprüfung laufen über `placement.js`.
 */

/** 90° im Uhrzeigersinn, auch für diagonale Bandrichtungen (0–7). */
const rotDir = (d) => (d < 4 ? (d + 1) & 3 : ((d - 3) % 4) + 4);

const snapOf = (b) => ({
  dx: b.x,
  dy: b.y,
  t: b.t,
  dir: b.dir,
  fromDir: b.fromDir,
  filter: b.filter ? { ...b.filter } : undefined,
  target: b.target || '',
});

/**
 * Alle Gebäude einsammeln, deren Ursprung im Rechteck `{x0,y0,x1,y1}` liegt
 * (Zellen). Liefert `null`, wenn nichts getroffen wurde.
 */
export function captureBlueprint(r) {
  const x0 = Math.min(r.x0, r.x1),
    x1 = Math.max(r.x0, r.x1),
    y0 = Math.min(r.y0, r.y1),
    y1 = Math.max(r.y0, r.y1);
  const picked = blds.filter((b) => b.x >= x0 && b.x <= x1 && b.y >= y0 && b.y <= y1);
  if (!picked.length) return null;
  const ox = Math.min(...picked.map((b) => b.x)),
    oy = Math.min(...picked.map((b) => b.y));
  const cells = picked.map((b) => {
    const s = snapOf(b);
    s.dx = b.x - ox;
    s.dy = b.y - oy;
    return s;
  });
  const w = Math.max(...cells.map((c) => c.dx)) + 1;
  const h = Math.max(...cells.map((c) => c.dy)) + 1;
  return { w, h, cells };
}

/** Aktuelle Gesamtkosten eines Bauplans (Baurabatt des Skill-Trees berücksichtigt). */
export const blueprintCost = (bp) =>
  bp && bp.cells ? bp.cells.reduce((a, c) => a + costOf(c.t), 0) : 0;

/** Ursprungszelle, wenn der Plan um die Zelle (cx,cy) zentriert eingesetzt wird. */
export const pasteOrigin = (bp, cx, cy) => ({
  x: cx - ((bp.w - 1) >> 1),
  y: cy - ((bp.h - 1) >> 1),
});

/** Dreht den Plan 90° im Uhrzeigersinn (Maße tauschen, Richtungen rotieren). */
export function rotateBlueprint(bp) {
  return {
    w: bp.h,
    h: bp.w,
    cells: bp.cells.map((c) => ({ ...c, dx: bp.h - 1 - c.dy, dy: c.dx, dir: rotDir(c.dir) })),
  };
}

/** Grund, warum der Plan an (ox,oy) nicht passt – oder null. */
export function pasteReason(bp, ox, oy) {
  if (!bp || !bp.cells || !bp.cells.length) return 'Kein Bauplan kopiert';
  let blocked = false,
    outside = false,
    locked = false;
  for (const c of bp.cells) {
    const d = DEF[c.t];
    if (!d) return 'Unbekanntes Gebäude';
    if (!isUnlocked(c.t)) locked = true;
    const x = ox + c.dx,
      y = oy + c.dy;
    if (x < 0 || y < 0 || x + d.w > GRID_W || y + d.h > GRID_H) {
      outside = true;
      continue;
    }
    for (let yy = y; yy < y + d.h; yy++)
      for (let xx = x; xx < x + d.w; xx++) if (occ[idx(xx, yy)]) blocked = true;
  }
  if (outside) return 'Außerhalb der Fabrik';
  if (blocked) return 'Blockiert';
  if (locked) return 'Im Skill-Tree freizuschalten';
  const cost = blueprintCost(bp);
  if (S.money < cost) return 'Zu teuer: ' + cost + ' €';
  return null;
}

/**
 * Setzt den ganzen Plan auf einmal ein (alles oder nichts) und bucht die
 * Gesamtkosten als eine Rückgängig-Einheit. Liefert einen Fehlergrund oder null.
 */
export function pasteBlueprint(bp, ox, oy) {
  const reason = pasteReason(bp, ox, oy);
  if (reason) return reason;
  const cost = blueprintCost(bp);
  const placed = [];
  for (const c of bp.cells) {
    const b = addBuilding(c.t, ox + c.dx, oy + c.dy, {
      free: true,
      dir: c.dir,
      fromDir: c.fromDir,
    });
    if (!b) {
      for (const p of placed) removeBuilding(p);
      return 'Blockiert';
    }
    if (c.filter) b.filter = { ...c.filter };
    b.target = c.target || '';
    placed.push(b);
  }
  S.money -= cost;
  pushGroup(true, placed, cost);
  return null;
}
