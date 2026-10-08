import { describe, it, expect, beforeEach } from 'vitest';
import { boot, put, run } from './helpers.js';
import { S, corpses, sticks } from '../src/core/state.js';
import { feed, itemPos, roomIn, MIN_GAP } from '../src/core/belts.js';
import { buildBeltPath } from '../src/core/belt-path.js';
import { bldAtCell } from '../src/core/grid.js';
import { DEF } from '../src/config/building-defs.js';

const limb = (over = {}) => ({ kind: 'limb', part: 'armL', p: 0, lat: 0, ...over });

describe('Bandtransport', () => {
  beforeEach(() => boot());

  it('schiebt Waren in Fahrtrichtung und übergibt ans Nachbarband', () => {
    const a = put('belt', 10, 20, { dir: 0 });
    const b = put('belt', 11, 20, { dir: 0 });
    a.items.push(limb());
    run(1.5);
    expect(a.items.length).toBe(0);
    expect(b.items.length).toBe(1);
    expect(b.items[0].part).toBe('armL');
  });

  it('hält den Mindestabstand zwischen Waren', () => {
    const a = put('belt', 10, 20, { dir: 0 });
    put('bin', 11, 20);
    a.items.push(limb({ p: 0.9 }), limb({ p: 0.45 }), limb({ p: 0 }));
    for (let s = 0; s < 12; s++) {
      run(0.1);
      for (let i = 1; i < a.items.length; i++)
        expect(a.items[i - 1].p - a.items[i].p).toBeGreaterThanOrEqual(MIN_GAP - 1e-6);
    }
  });

  it('lässt Waren fallen, wenn kein Ziel folgt', () => {
    const a = put('belt', 10, 20, { dir: 0 });
    a.items.push(limb());
    run(2);
    expect(a.items.length).toBe(0);
    expect(corpses.length + sticks.length).toBeGreaterThan(0);
  });

  it('lässt Waren aus der Welt laufen und zählt sie als entkommen', () => {
    const a = put('belt', 127, 20, { dir: 0 });
    a.items.push(limb());
    run(2);
    expect(S.escaped).toBe(1);
    expect(a.items.length).toBe(0);
  });

  it('fährt Waren über die Diagonale eines gebauten Pfads', () => {
    buildBeltPath(10, 20, 12, 22);
    const a = bldAtCell(10, 20);
    expect(a).toBeTruthy();
    a.items.push(limb());
    let mid = 0;
    for (let i = 0; i < 80 && !mid; i++) {
      run(0.1);
      const c = bldAtCell(11, 21);
      mid = c ? c.items.length : 0;
    }
    expect(mid).toBe(1);
  });

  it('übergibt diagonale Ware am Pfadende an eine Maschine', () => {
    buildBeltPath(10, 20, 11, 21);
    put('bin', 12, 22);
    const a = bldAtCell(10, 20);
    const bin = bldAtCell(12, 22);
    expect(a).toBeTruthy();
    expect(bin).toBeTruthy();
    a.items.push(limb());
    let fed = 0;
    for (let i = 0; i < 80 && !fed; i++) {
      run(0.1);
      fed = bin.items.length;
    }
    expect(fed).toBe(1);
  });

  it('nimmt diagonale Eingänge über die Komponentenregel an', () => {
    const m = put('spike', 11, 21, { dir: 0 });
    const take = (d) => {
      m.items.length = 0;
      return feed(m, limb(), d, { x: 11, y: 21 });
    };
    expect(take(0)).toBe(true); // orthogonal
    expect(take(5)).toBe(true); // SO: Anteile 0,1 – 0 passt
    expect(take(4)).toBe(true); // NO: Anteile 0,3 – 0 passt
    expect(take(6)).toBe(false); // SW: Anteile 2,1
    expect(take(7)).toBe(false); // NW: Anteile 2,3
    expect(take(2)).toBe(false); // von hinten
  });

  it('stopppt am vollen Ziel und startet wieder bei Platz', () => {
    const a = put('belt', 10, 20, { dir: 0 });
    const bin = put('bin', 11, 20);
    while (bin.items.length < (DEF.bin.cap || 9)) bin.items.push(limb());
    a.items.push(limb());
    run(1);
    expect(a.items.length).toBe(1);
    bin.items.length = 0;
    run(1);
    expect(a.items.length).toBe(0);
  });

  it('roomIn prüft Abstand und Deckel', () => {
    const belt = put('belt', 5, 5, { dir: 0 });
    expect(roomIn(belt)).toBe(true);
    belt.items.push(limb({ p: 0.2 }));
    expect(roomIn(belt)).toBe(false);
    belt.items[0].p = 0.9;
    expect(roomIn(belt)).toBe(true);
  });

  it('Position folgt p entlang der Bahn', () => {
    const b = put('belt', 10, 20, { dir: 0 });
    const mid = itemPos(b, { p: 0.5, lat: 0 });
    expect(mid.x).toBe(10 * 48 + 24);
    expect(mid.y).toBe(20 * 48 + 24);
    expect(itemPos(b, { p: null }).x).toBe((10 + 0.5) * 48);
  });

  it('Position auf der Diagonale folgt den Ecken', () => {
    const b = put('belt', 10, 20, { dir: 5 });
    expect(itemPos(b, { p: 0, lat: 0 })).toEqual({ x: 10 * 48, y: 20 * 48 });
    expect(itemPos(b, { p: 1, lat: 0 })).toEqual({ x: 11 * 48, y: 21 * 48 });
    const mid = itemPos(b, { p: 0.5, lat: 0 });
    expect(mid.x).toBe(10 * 48 + 24);
    expect(mid.y).toBe(20 * 48 + 24);
  });
});
