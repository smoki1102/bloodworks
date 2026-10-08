import { MARKET_PRICE, MARKET_RESERVE, MARKET_RATE } from '../config/constants.js';
import { availBlood, addBlood, takeBlood } from './pipes.js';
import { noteRate } from './flow.js';
import { S, nets } from './state.js';
import { upgEff } from './upgrades.js';

export const defaultReserve = () => ({ v: MARKET_RESERVE, unit: 'abs' });

export function setReserve(b, v, unit) {
  b.reserve = { v: Math.max(0, Math.round(v)), unit: unit === 'pct' ? 'pct' : 'abs' };
  b.reserveTouched = true;
}

/** Höhe der Reserve in Blut – absolut oder als Anteil der Pool-Kapazität. */
export function reserveValue(b) {
  const r = b.reserve || defaultReserve();
  if (r.unit === 'pct') {
    const cap = b.netId != null && b.netId >= 0 ? netCapOf(b) : S.bloodCap;
    return (cap * r.v) / 100;
  }
  return r.v;
}

function netCapOf(b) {
  const n = nets[b.netId];
  return n ? n.cap : S.bloodCap;
}

/** Wie viel Blut der Markt noch verkaufen darf. */
export const sellable = (b) => Math.max(0, availBlood(b) - reserveValue(b));

export const priceOf = () => MARKET_PRICE * upgEff('price') * (S.fx?.price ?? 1);

/**
 * Verkauft Blut aus dem Pool des Marktes – nie unter die Reserve.
 * @returns {number} verkauftes Blut
 */
export function stepMarket(b, dt, pf, run) {
  if (b.on === false || pf < 0.15) return 0;
  const room = sellable(b);
  if (room <= 0.01) return 0;
  const q = Math.min(room, MARKET_RATE * dt * run);
  if (q <= 0) return 0;
  const got = takeBlood(b, q);
  if (got <= 0) return 0;
  S.money += got * priceOf();
  S.stats.sold += got;
  noteRate(b, got / dt, dt);
  return got;
}

/** Reserve: Pool maximal bis zur Reserve füllen (für Tests/Debug). */
export function topUp(b, q) {
  return addBlood(b, q);
}
