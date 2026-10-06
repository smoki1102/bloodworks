import { DEF } from '../config/building-defs.js';
import {
  ACID_MONEY,
  ACID_TIME,
  BIN_ASH,
  BIN_BLOOD,
  BIN_ROT_TIME,
  DIRT_IDLE,
  DIRT_TIME,
  DIRT_WORK,
  DRAIN_BUF,
  DRAIN_RATE,
  DRAIN_REACH,
  KELLER_FLOOR,
  LAB_CLEAN_RATE,
  MARKET_PRICE,
  MARKET_RATE,
  OVEN_ASH,
  OVEN_ENERGY,
  OVEN_TIME,
  PRESS_SPEED,
} from '../config/constants.js';
import { bloodColor, burst, floatText, nBurst } from './effects.js';
import { noteOut, noteRate } from './flow.js';
import { bldRect } from './placement.js';
import { S, blds, floorBlood } from './state.js';
import { clamp, colAt } from '../utils/helpers.js';

export const capOf = (t) => DEF[t].cap ?? 0;

/** Fortschrittsfaktor einer Arbeit: Dreck zieht mit. */
export const runFactor = (b, pf) => pf * clamp(1 - b.dirt / 150, 0.2, 1);

/**
 * Ein Geräte-Tick. Reihenfolge: Reinigung → Aus → Fortschritt → Typ-Verhalten.
 * Rückgabe: true, wenn das Gerät in diesem Tick gearbeitet hat.
 */
export function machine(b, dt, pf) {
  const d = DEF[b.t];
  const r = bldRect(b);
  if (b.clean > 0) {
    b.clean -= dt;
    if (b.clean <= 0) {
      b.clean = 0;
      b.dirt = 0;
    }
    b.worked = false;
    return false;
  }
  if (b.on === false) {
    b.worked = false;
    b.glow = 0;
    return false;
  }
  const run = runFactor(b, pf);
  let worked = false;
  if (b.t === 'press') {
    worked = run > 0.05;
    b.phase += dt * PRESS_SPEED * run;
  }
  if (b.t === 'market') {
    if (S.blood > 0.01 && pf > 0.15) {
      const q = Math.min(S.blood, MARKET_RATE * dt * run);
      if (q > 0) {
        S.blood -= q;
        S.money += q * MARKET_PRICE;
        S.sold += q;
        worked = true;
        noteRate(b, q / dt, dt);
      }
    }
    if (!worked) b.rate *= 1 - dt / 2;
  }
  if (b.t === 'drain') {
    if (pf > 0.1 && b.buf < DRAIN_BUF) {
      const c0 = Math.max(0, b.col - DRAIN_REACH);
      const c1 = Math.min(floorBlood.length - 1, b.col + b.w - 1 + DRAIN_REACH);
      let got = 0;
      for (let c = c0; c <= c1; c++) {
        const take = Math.min(floorBlood[c], (DRAIN_RATE * dt * run) / (c1 - c0 + 1));
        floorBlood[c] -= take;
        got += take;
      }
      got = Math.min(got, DRAIN_BUF - b.buf);
      b.buf += got;
      if (got > 0) {
        worked = true;
        noteRate(b, got / dt, dt);
      }
    }
    if (b.link === 'ok' && b.buf > 0 && S.bloodCap > S.blood) {
      const flush = Math.min(b.buf, S.bloodCap - S.blood, DRAIN_RATE * dt * run);
      b.buf -= flush;
      S.blood += flush;
    }
    b.glow = b.buf > 0.5 ? Math.min(1, b.glow + dt * 4) : Math.max(0, b.glow - dt * 2);
  }
  if (b.t === 'bin') {
    worked = b.items.length > 0;
    for (let i = b.items.length - 1; i >= 0; i--) {
      const it = b.items[i];
      it.rot += dt * run;
      if (it.rot >= BIN_ROT_TIME) {
        b.items.splice(i, 1);
        addBinBlood(r);
        S.ash += BIN_ASH;
        noteOut(b, S.t);
      }
    }
  }
  if (b.t === 'oven') {
    worked = b.items.length > 0;
    if (worked) {
      b.prog += dt * run;
      b.glow = Math.min(1, b.glow + dt * 2);
      if (b.prog >= OVEN_TIME) {
        b.prog = 0;
        b.items.pop();
        S.energy = Math.min(S.energyMax, S.energy + OVEN_ENERGY);
        S.ash += OVEN_ASH;
        noteOut(b, S.t);
      }
    } else b.glow = Math.max(0, b.glow - dt * 1.5);
  }
  if (b.t === 'acid') {
    worked = b.items.length > 0;
    if (worked) {
      b.prog += dt * run;
      if (b.prog >= ACID_TIME) {
        b.prog = 0;
        b.items.pop();
        S.money += ACID_MONEY;
        noteOut(b, S.t);
      }
    }
  }
  if (b.t === 'lab') {
    worked = pf > 0.1;
    if (worked)
      for (const o of blds)
        if (o.dirt > 0 && o.clean <= 0) o.dirt = Math.max(0, o.dirt - LAB_CLEAN_RATE * dt * pf);
    b.glow = worked ? 0.5 : Math.max(0, b.glow - dt * 2);
  }
  if (d.dirt) {
    const byWork = d.band === 'belt' ? DIRT_TIME : worked ? DIRT_WORK : DIRT_IDLE;
    b.dirt = Math.min(100, b.dirt + d.dirt * dt * byWork);
  }
  b.worked = worked;
  return worked;
}

/** Zerlegte Leichen bluten auf den Boden, nicht mehr direkt in den Tank. */
function addBinBlood(r) {
  const per = BIN_BLOOD / Math.max(1, r.w / 48);
  for (let c = colAt(r.x); c <= colAt(r.x + r.w); c++) {
    if (c < 0 || c >= floorBlood.length) continue;
    floorBlood[c] = Math.min(11, floorBlood[c] + per);
  }
  burst(r.x + r.w / 2, KELLER_FLOOR - 20, bloodColor(), nBurst(4), 90);
  floatText(r.x + r.w / 2, KELLER_FLOOR - 60, '+' + BIN_BLOOD, bloodColor());
}