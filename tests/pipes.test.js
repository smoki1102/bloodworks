import { describe, it, expect, beforeEach } from 'vitest';
import { boot, put, run } from './helpers.js';
import { S, nets } from '../src/core/state.js';
import { idx, bldAtCell } from '../src/core/grid.js';
import {
  addBlood,
  availBlood,
  bloodCapTotal,
  bloodTotal,
  globalCap,
  netOf,
  spendBlood,
  suctionCells,
  takeBlood,
} from '../src/core/pipes.js';
import { setReserve, sellable, reserveValue, priceOf } from '../src/core/market.js';
import { beltBlood, floorBlood } from '../src/core/state.js';
import { addBeltBlood, addFloorBlood } from '../src/core/effects.js';
import { BASE_CAP, TANK_CAP, MARKET_PRICE, MARKET_RESERVE } from '../src/config/constants.js';

/** Bodenblut einer Spalte (Blut sickert nach unten, deshalb zeilenweise). */
const colBlood = (x) => {
  let v = 0;
  for (let y = 0; y < 64; y++) v += floorBlood[idx(x, y)];
  return v;
};

/** Tank – Pipes – Abfluss – Pipes – Markt, optional Generator. */
function netWorld(withGen = false) {
  put('tank', 20, 40);
  put('pipe', 19, 40);
  put('pipe', 22, 40);
  put('pipe', 23, 40);
  const drain = put('drain', 24, 40);
  put('pipe', 25, 40);
  const market = put('market', 26, 40);
  let gen = null;
  if (withGen) {
    put('pipe', 26, 41);
    gen = put('gen', 26, 42);
  }
  run(0.1);
  return { drain, market, gen };
}

describe('Pipe-Netze', () => {
  beforeEach(() => boot());

  it('verbindet Tank, Abfluss, Markt und Generator zu einem Netz', () => {
    const { drain, market, gen } = netWorld(true);
    expect(nets.length).toBe(1);
    expect(nets[0].cap).toBe(TANK_CAP);
    expect(drain.netId).toBe(0);
    expect(market.netId).toBe(0);
    expect(gen.netId).toBe(0);
    expect(drain.link).toBe('ok');
    expect(market.link).toBe('ok');
    expect(gen.link).toBe('ok');
    expect(bldAtCell(24, 40)).toBe(drain);
  });

  it('trennt Netze, die sich nicht berühren', () => {
    netWorld();
    put('tank', 60, 40);
    put('pipe', 62, 40);
    put('market', 63, 40);
    run(0.1);
    expect(nets.length).toBe(2);
    expect(nets.every((n) => n.cap === TANK_CAP)).toBe(true);
  });

  it('gibt ohne Tank im Netz keinen Anschluss', () => {
    put('pipe', 24, 40);
    const drain = put('drain', 25, 40);
    put('pipe', 26, 40);
    const market = put('market', 27, 40);
    run(0.1);
    expect(nets.length).toBe(1);
    expect(nets[0].cap).toBe(0);
    expect(drain.link).toBe('none');
    expect(market.link).toBe('none');
    put('tank', 22, 40);
    run(0.1);
    expect(drain.link).toBe('ok');
    expect(nets[0].cap).toBe(TANK_CAP);
  });

  it('Tank ohne Pipes erhöht nur den globalen Pool', () => {
    run(0.1);
    expect(globalCap()).toBe(BASE_CAP);
    expect(S.bloodCap).toBe(BASE_CAP);
    put('tank', 40, 40);
    run(0.1);
    expect(globalCap()).toBe(BASE_CAP + TANK_CAP);
    expect(bloodCapTotal()).toBeGreaterThanOrEqual(BASE_CAP);
  });

  it('speist ein und entnimmt aus dem Netzpool', () => {
    const { drain, market } = netWorld();
    const n = netOf(drain);
    expect(n).toBeTruthy();
    expect(addBlood(drain, 60)).toBe(60);
    expect(n.v).toBe(60);
    expect(availBlood(market)).toBe(60);
    expect(addBlood(drain, 9999)).toBe(n.cap - 60);
    expect(n.v).toBe(n.cap);
    expect(takeBlood(market, 40)).toBe(40);
    expect(n.v).toBe(n.cap - 40);
    expect(takeBlood(market, 9999)).toBe(n.cap - 40);
  });

  it('zahlt Kaufpreise aus globalen Pool und Netzen', () => {
    const { drain } = netWorld();
    addBlood(drain, 100);
    S.blood = 30;
    expect(bloodTotal()).toBe(130);
    expect(spendBlood(50)).toBe(true);
    expect(S.blood).toBe(0);
    expect(bloodTotal()).toBe(80);
    expect(spendBlood(1000)).toBe(false);
    expect(bloodTotal()).toBe(80);
    expect(spendBlood(80)).toBe(true);
    expect(bloodTotal()).toBe(0);
  });

  it('saugt Bodenblut auf und pumpt es ins Netz', () => {
    netWorld();
    addFloorBlood(24, 40, 11);
    expect(suctionCells(24, 40, 1).length).toBe(9);
    run(0.5);
    expect(nets[0].v).toBeGreaterThan(0);
  });

  it('angeschlossene Absaugung saugt Bandblut ins Netz statt auf den Boden', () => {
    put('tank', 20, 40);
    put('pipe', 19, 40);
    put('belt', 18, 40, { dir: 0 });
    run(0.1);
    expect(nets.length).toBe(1);
    addBeltBlood(18, 40, 6);
    run(1);
    expect(colBlood(18)).toBe(0);
    expect(beltBlood[idx(18, 40)]).toBeLessThan(6);
    expect(nets[0].v).toBeGreaterThan(0);
  });

  it('ohne Anschluss tropft Bandblut weiterhin auf den Boden', () => {
    put('tank', 20, 40);
    put('belt', 18, 40, { dir: 0 });
    run(0.1);
    addBeltBlood(18, 40, 6);
    run(1);
    expect(colBlood(18)).toBeGreaterThan(0);
    expect(nets.length).toBe(0);
  });

  it('hält die Verkaufsreserve ein', () => {
    const { market } = netWorld();
    addBlood(market, 100);
    setReserve(market, 60, 'abs');
    expect(reserveValue(market)).toBe(60);
    expect(sellable(market)).toBe(40);
    const m0 = S.money;
    run(3);
    expect(nets[0].v).toBeLessThan(100);
    expect(nets[0].v).toBeGreaterThanOrEqual(60 - 1e-6);
    expect(S.money).toBeGreaterThan(m0);
    expect(S.sold).toBeGreaterThan(0);
    void MARKET_RESERVE;
  });

  it('Generator wandelt Nettblut in Energie um', () => {
    const { gen } = netWorld(true);
    addBlood(gen, 100);
    const e0 = S.energy;
    run(1);
    expect(S.energy).toBeGreaterThan(e0);
    expect(nets[0].v).toBeLessThan(100);
  });

  it('Markt ohne Pipes verkauft aus dem globalen Pool', () => {
    put('tank', 20, 40);
    const market = put('market', 40, 40);
    S.blood = 80;
    run(0.1);
    expect(market.link).toBe('ok');
    expect(netOf(market)).toBeNull();
    const m0 = S.money;
    run(2);
    expect(S.blood).toBeLessThan(80);
    expect(S.money).toBeGreaterThan(m0);
    expect(priceOf()).toBeCloseTo(MARKET_PRICE, 5);
  });
});
