import { DEF } from '../config/building-defs.js';
import { PULL_TIME, UTIL_TAU } from '../config/constants.js';
import { S, blds } from './state.js';

/** Nachbar im selben Band, direkt angrenzend (Spalten berühren sich). */
export function horizontal(b, type) {
  const band = DEF[b.t].band;
  return (
    blds.find((o) => {
      if (o.t !== type || DEF[o.t].band !== band) return false;
      return o.col + o.w === b.col || b.col + b.w === o.col;
    }) || null
  );
}

/** Maschine über/unter derselben Spalten, in einem anderen Band. */
export function vertical(b, type) {
  const band = DEF[b.t].band;
  return (
    blds.find((o) => {
      if (o.t !== type || DEF[o.t].band === band) return false;
      return o.col < b.col + b.w && b.col < o.col + o.w;
    }) || null
  );
}

/** Aktualisiert b.link: 'ok', 'none' oder '-' (nicht relevant). */
export function updateLinks() {
  for (const b of blds) {
    if (b.t === 'drain') b.link = horizontal(b, 'tank') ? 'ok' : 'none';
    else if (b.t === 'market' || b.t === 'gen') b.link = vertical(b, 'tank') ? 'ok' : 'none';
    else b.link = '-';
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

/** Ofen/Säure ziehen Leichen aus einem angrenzenden Container. */
function pullItems(dt) {
  for (const b of blds) {
    if (b.t !== 'oven' && b.t !== 'acid') continue;
    if (b.on === false || b.clean > 0) continue;
    b.pullCd = (b.pullCd ?? 0) - dt;
    if (b.items.length >= DEF[b.t].cap || b.pullCd > 0) continue;
    const src = horizontal(b, 'bin');
    if (!src || !src.items.length) continue;
    b.pullCd = PULL_TIME;
    b.items.push(src.items.shift());
    noteOut(src, S.t);
    src.pulse = 0.5;
    b.pulse = 0.5;
  }
}

export function flow(dt) {
  updateLinks();
  for (const b of blds) {
    b.util += ((b.worked ? 1 : 0) - b.util) * Math.min(1, dt / UTIL_TAU);
    b.rate = Math.max(0, b.rate * (1 - dt / 6));
    if (b.pulse && b.pulse > 0) b.pulse -= dt;
  }
  pullItems(dt);
}