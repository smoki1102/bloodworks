import { C, ctx } from './canvas.js';
import { rgba } from '../config/palette.js';
import { clamp } from '../utils/helpers.js';
import { S } from '../core/state.js';
import { drawItemShape } from './figures.js';

/* ------------------------------ Grundformen ------------------------------ */

/** Fortschrittsbalken über einem Gerät (Hintergrund + Füllung). */
export function bar(x, y, w, frac, col) {
  ctx.fillStyle = rgba(C.barBg, 0.4);
  ctx.fillRect(x, y, w, 6);
  ctx.fillStyle = col;
  ctx.fillRect(x, y, w * clamp(frac, 0, 1), 6);
}

/** Gerätegehäuse über dem Footprint `r`. */
export function housing(r, col) {
  ctx.fillStyle = C.panel;
  ctx.fillRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
  ctx.fillStyle = col;
  ctx.fillRect(r.x + 2, r.y + 2, r.w - 4, 11);
  ctx.fillStyle = rgba(C.shade, 0.12);
  ctx.fillRect(r.x + 2, r.y + r.h - 5, r.w - 4, 3);
  ctx.strokeStyle = C.steel;
  ctx.lineWidth = 2;
  ctx.strokeRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
}

/** Läuft die Maschine? (sauber, eingeschaltet, genug Energie) */
export const machineOn = (b) => b.clean <= 0 && b.on !== false && S.pf > 0.15;

/** Wartende Items als Reihe(n) im unteren Footprint-Bereich zeichnen. */
export function queuedItems(r, b, cols = 3, pad = 16) {
  const max = cols * 2;
  const colW = cols > 1 ? (r.w - pad * 2) / (cols - 1) : 0;
  b.items.slice(0, max).forEach((it, i) => {
    const c = i % cols;
    const row = (i / cols) | 0;
    drawItemShape(it, r.x + pad + c * colW, r.y + r.h - 16 - row * 20);
  });
}
