import { DEF } from '../config/building-defs.js';
import { UTIL_TAU } from '../config/constants.js';
import { bldAtCell } from './grid.js';
import { exitCellOf } from './belts.js';
import { netHasTank, netOf, worldTankCount } from './pipes.js';
import { blds } from './state.js';

/** Verbindungsstatus: Markt/Generator/Abfluss brauchen ein Tank-Netz. */
export function updateLinks() {
  for (const b of blds) {
    if (b.t === 'spawn') {
      const c = exitCellOf(b, b.dir ?? 0, 0);
      const t = bldAtCell(c.x, c.y);
      b.link = t && DEF[t.t].kind === 'belt' ? 'ok' : 'none';
      continue;
    }
    const k = DEF[b.t].kind;
    if (k === 'market' || k === 'gen' || k === 'drain') {
      const n = netOf(b);
      b.link = n ? (netHasTank(n) ? 'ok' : 'none') : worldTankCount() > 0 ? 'ok' : 'none';
    } else b.link = '-';
  }
}

/** Ein fertiges Teil wurde ausgegeben – Durchsatz zählen (Teile/s). */
export function noteOut(b, t) {
  b.outCount++;
  if (b.lastOut != null) {
    const gap = Math.max(1e-3, t - b.lastOut);
    b.rate = b.rate ? b.rate + (1 / gap - b.rate) * 0.35 : 1 / gap;
  }
  b.lastOut = t;
}

/** Kontinuierlicher Fluss (Blut/s etc.) geglättet mitführen. */
export function noteRate(b, v, dt) {
  b.rate = b.rate + (v - b.rate) * Math.min(1, dt / UTIL_TAU);
}

export function flow(dt) {
  updateLinks();
  for (const b of blds) {
    b.util += ((b.worked ? 1 : 0) - b.util) * Math.min(1, dt / UTIL_TAU);
    b.rate = Math.max(0, b.rate * (1 - dt / 6));
    if (b.pulse && b.pulse > 0) b.pulse -= dt;
    if (b.glow > 0 && !b.worked) b.glow = Math.max(0, b.glow - dt * 2);
    b.worked = false;
  }
}
