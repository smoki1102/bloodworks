import { DEF } from '../config/building-defs.js';
import {
  ACID_MONEY,
  ACID_TIME,
  BIN_ASH,
  BIN_BLOOD,
  BIN_CAP,
  BIN_ROT_TIME,
  DIRT_TIME,
  DRAIN_RATE,
  KELLER_FLOOR,
  LAB_CLEAN_RATE,
  MARKET_PRICE,
  MARKET_RATE,
  OVEN_ASH,
  OVEN_CAP,
  OVEN_ENERGY,
  OVEN_TIME,
  PRESS_SPEED,
} from '../config/constants.js';
import { bloodColor, burst, floatText, nBurst } from './effects.js';
import { bldRect } from './placement.js';
import { S, blds, floorBlood } from './state.js';
import { clamp } from '../utils/helpers.js';

export const capOf = (t) => (t === 'bin' ? BIN_CAP : t === 'oven' || t === 'acid' ? OVEN_CAP : 0);

/** Fortschrittsfaktor einer Arbeit: Dreck und Strom ziehen mit. */
export const runFactor = (b, pf) => pf * clamp(1 - b.dirt / 150, 0.2, 1);

/**
 * Ein Geräte-Tick. Reihenfolge: Reinigung → Fortschritt → Typ-Verhalten.
 * Rückgabe: true, wenn das Gerät in diesem Tick gearbeitet hat.
 */
export function machine(b, dt, pf) {
  const d = DEF[b.t],
    r = bldRect(b),
    mx = r.x + r.w / 2;
  if (b.clean > 0) {
    b.clean -= dt;
    if (b.clean <= 0) {
      b.clean = 0;
      b.dirt = 0;
    }
    return false;
  }
  const run = runFactor(b, pf);
  if (d.dirt) b.dirt = Math.min(100, b.dirt + d.dirt * dt * DIRT_TIME);
  if (b.t === 'press') b.phase += dt * PRESS_SPEED * run;
  if (b.t === 'market' && S.blood > 0.01 && pf > 0.15) {
    const q = Math.min(S.blood, MARKET_RATE * dt * run);
    S.blood -= q;
    S.money += q * MARKET_PRICE;
    S.sold += q;
  }
  if (b.t === 'drain' && pf > 0.1 && S.bloodCap > S.blood) {
    let got = 0;
    for (let c = b.col; c < b.col + b.w; c++) {
      const take = Math.min(floorBlood[c], (DRAIN_RATE * dt * run) / b.w);
      floorBlood[c] -= take;
      got += take;
    }
    got = Math.min(got, S.bloodCap - S.blood);
    S.blood += got;
    b.glow = got > 0.2 ? Math.min(1, b.glow + dt * 4) : Math.max(0, b.glow - dt * 2);
  }
  if (b.t === 'bin') {
    for (let i = b.items.length - 1; i >= 0; i--) {
      const it = b.items[i];
      it.rot += dt * run;
      if (it.rot >= BIN_ROT_TIME) {
        b.items.splice(i, 1);
        S.blood = Math.min(S.bloodCap, S.blood + BIN_BLOOD);
        S.ash += BIN_ASH;
        burst(mx, KELLER_FLOOR - 20, bloodColor(), nBurst(4), 90);
        floatText(mx, KELLER_FLOOR - 60, '+' + BIN_BLOOD, bloodColor());
      }
    }
    if (b.items.length) b.dirt = Math.min(100, b.dirt + dt * 0.5);
  }
  if (b.t === 'oven') {
    if (b.items.length) {
      b.prog += dt * run;
      b.glow = Math.min(1, b.glow + dt * 2);
      if (b.prog >= OVEN_TIME) {
        b.prog = 0;
        b.items.pop();
        S.energy = Math.min(S.energyMax, S.energy + OVEN_ENERGY);
        S.ash += OVEN_ASH;
        burst(mx, KELLER_FLOOR - 60, '#eee', 6, 100);
        floatText(mx, KELLER_FLOOR - 90, '+' + OVEN_ENERGY + ' ⚡', '#ddd');
      }
    } else b.glow = Math.max(0, b.glow - dt * 1.5);
  }
  if (b.t === 'acid' && b.items.length) {
    b.prog += dt * run;
    if (b.prog >= ACID_TIME) {
      b.prog = 0;
      b.items.pop();
      S.money += ACID_MONEY;
      burst(mx, KELLER_FLOOR - 30, '#9b9', 5, 90);
      floatText(mx, KELLER_FLOOR - 70, '+' + ACID_MONEY + ' €', '#ddd');
    }
  }
  if (b.t === 'lab' && pf > 0.1) {
    for (const o of blds)
      if (o.dirt > 0 && o.clean <= 0) o.dirt = Math.max(0, o.dirt - LAB_CLEAN_RATE * dt * pf);
    b.glow = 0.5;
  }
  return run > 0.05;
}
