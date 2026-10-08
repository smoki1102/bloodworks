import { describe, it, expect, beforeEach } from 'vitest';
import { boot, put, run } from './helpers.js';
import { S, floorBlood } from '../src/core/state.js';
import { idx } from '../src/core/grid.js';
import { ROUTE_CAP, BIN_ROT_TIME, OVEN_TIME, ACID_TIME, SHOP_TIME } from '../src/config/constants.js';
import { filterMatch, makeBody, severPart, missingOf } from '../src/core/anatomy.js';
import { bladeCut, hitChance } from '../src/core/machines.js';
import { feed } from '../src/core/belts.js';
import { DEF } from '../src/config/building-defs.js';

const corpse = (missing = []) => ({
  kind: 'corpse',
  p: 0,
  lat: 0,
  rot: 0,
  missing,
  bleed: 0,
  life: 120,
});
const limb = (part = 'armL') => ({ kind: 'limb', part, p: 0, lat: 0, bleed: 0, life: 120 });

/** Eingang → Band → Maschine → Band → Container. null, wenn gesperrt. */
function killLine(machine) {
  put('spawn', 10, 20, { dir: 0 });
  put('belt', 12, 20, { dir: 0 });
  if (!put(machine, 13, 20, { dir: 0 })) return null;
  const ex = 13 + DEF[machine].w;
  put('belt', ex, 20, { dir: 0 });
  return put('bin', ex + 1, 20);
}

describe('Quelle', () => {
  beforeEach(() => boot());

  it('setzt nur Sticks, wenn ein Band am Ausgang steht', () => {
    put('spawn', 10, 20, { dir: 0 });
    run(6);
    expect(S.stats.spawned).toBe(0);
    put('belt', 12, 20, { dir: 0 });
    run(6);
    expect(S.stats.spawned).toBeGreaterThan(0);
  });
});

describe('Maschinen', () => {
  beforeEach(() => boot());

  it('Spikes-Walze tötet und sammelt Körperteile', () => {
    killLine('spike');
    run(40);
    expect(S.stats.kills).toBeGreaterThan(0);
    const parts = Object.values(S.parts).reduce((a, b) => a + b, 0);
    expect(parts).toBeGreaterThan(0);
    expect(Object.values(S.parts).some((v) => v > 0)).toBe(true);
  });

  it('Presse hält Sticks fest und quetscht sie im Takt tot', () => {
    killLine('press');
    run(40);
    expect(S.stats.kills).toBeGreaterThan(0);
  });

  it('Klingenpresse schneidet nur mit freigeschaltetem Skill', () => {
    expect(killLine('blade')).toBeNull();
    S.skill.lv.prec_blade = 1;
    killLine('blade');
    run(40);
    expect(S.stats.kills).toBeGreaterThan(0);
  });

  it('Mehrfachziele (Skill) trennen zusätzlich Teile der Zielgruppe', () => {
    S.skill.lv.prec_blade = 1;
    const b = put('blade', 13, 20, { dir: 0 });
    expect(b).toBeTruthy();
    b.target = 'arms';
    const body = makeBody();
    const it = { kind: 'stick', body, p: 0.5, lat: 0 };
    b.items.push(it);
    S.fx = { ...S.fx, hit: 0.5, multi: 1 };
    bladeCut(b, it);
    expect(body.lost).toBeGreaterThanOrEqual(2);
    const total = Object.values(S.parts).reduce((a, v) => a + v, 0);
    expect(total).toBeGreaterThanOrEqual(2);
  });

  it('ohne Zielgruppe trennt die Klinge nur ein Teil pro Schnitt', () => {
    S.skill.lv.prec_blade = 1;
    const b = put('blade', 13, 20, { dir: 0 });
    b.target = '';
    const body = makeBody();
    const it = { kind: 'stick', body, p: 0.5, lat: 0 };
    b.items.push(it);
    S.fx = { ...S.fx, hit: 0.5, multi: 3 };
    bladeCut(b, it);
    expect(body.lost).toBe(1);
    expect(hitChance()).toBeGreaterThanOrEqual(0.45);
  });

  it('Abschleuderer schleudert Sticks vom Band', () => {
    killLine('schleuder');
    run(25);
    expect(S.stats.ejected).toBeGreaterThan(0);
  });

  it('Labor reinigt schmutzige Maschinen', () => {
    const spike = put('spike', 10, 20);
    put('lab', 13, 20);
    spike.dirt = 60;
    run(1.5);
    expect(spike.dirt).toBeLessThan(60);
  });
});

describe('Senken', () => {
  beforeEach(() => boot());

  it('Container verrottet Waren zu Bodenblut (sickert nach unten)', () => {
    const bin = put('bin', 10, 20);
    bin.items.push(corpse());
    const col = (x, y0) => {
      let v = 0;
      for (let y = y0; y < 64; y++) v += floorBlood[idx(x, y)];
      return v;
    };
    const before = col(10, 20) + col(11, 20);
    run(BIN_ROT_TIME + 1);
    expect(bin.items.length).toBe(0);
    const after = col(10, 20) + col(11, 20);
    expect(after).toBeGreaterThan(before);
  });

  it('Verbrenner liefert Energie und Asche', () => {
    const oven = put('oven', 10, 20);
    oven.items.push(corpse());
    const e0 = S.energy;
    run(OVEN_TIME + 0.5);
    expect(S.energy).toBeGreaterThan(e0);
    expect(S.ash).toBeGreaterThan(0);
    expect(oven.items.length).toBe(0);
  });

  it('Säurebad zahlt Geld aus', () => {
    const acid = put('acid', 10, 20);
    acid.items.push(corpse());
    const m0 = S.money;
    run(ACID_TIME + 0.5);
    expect(S.money).toBeGreaterThan(m0);
    expect(acid.items.length).toBe(0);
  });

  it('Verkauf zahlt den Warenwert', () => {
    S.skill.lv.eco_shop = 1;
    const shop = put('shop', 10, 20);
    shop.items.push(limb('head'));
    const m0 = S.money;
    run(SHOP_TIME + 0.5);
    expect(S.money).toBeGreaterThan(m0);
    expect(shop.items.length).toBe(0);
  });
});

describe('Logistik', () => {
  beforeEach(() => boot());

  it('Weiche alterniert beide Ausgänge', () => {
    const w = put('weiche', 10, 20, { dir: 0 });
    put('belt', 11, 20, { dir: 0 });
    put('belt', 10, 21, { dir: 1 });
    const binE = put('bin', 12, 20);
    const binS = put('bin', 10, 22);
    for (let i = 0; i < ROUTE_CAP; i++) w.items.push({ ...corpse(), p: null });
    run(4);
    expect(w.items.length).toBe(0);
    expect(binE.items.length).toBeGreaterThan(0);
    expect(binS.items.length).toBeGreaterThan(0);
    expect(binE.items.length + binS.items.length).toBe(ROUTE_CAP);
  });

  it('Filter sortiert nach Regel', () => {
    S.skill.lv.log_filter = 1;
    const f = put('filter', 10, 20, { dir: 0 });
    f.filter = { by: 'part', val: 'head' };
    put('belt', 11, 20, { dir: 0 });
    put('belt', 10, 21, { dir: 1 });
    const binE = put('bin', 12, 20);
    const binS = put('bin', 10, 22);
    f.items.push({ ...corpse(['head']), p: null });
    f.items.push({ ...corpse([]), p: null });
    run(3);
    expect(binS.items.length).toBe(1);
    expect(binE.items.length).toBe(1);
  });

  it('Zusammenführung nimmt beide Seiten an, nicht die Seite', () => {
    const m = put('merge', 10, 20, { dir: 0 });
    const it = { ...limb(), p: 0, lat: 0 };
    expect(feed(m, { ...it }, 0, { x: 9, y: 20 })).toBe(true);
    expect(feed(m, { ...it }, 3, { x: 10, y: 21 })).toBe(true);
    expect(feed(m, { ...it }, 2, { x: 11, y: 20 })).toBe(false);
    expect(m.items.length).toBe(2);
  });

  it('Filterregel matcht Teile und Zustände', () => {
    const body = makeBody();
    severPart(body, 'head');
    expect(missingOf(body)).toEqual(['head']);
    expect(filterMatch({ kind: 'stick', body }, { by: 'part', val: 'head' })).toBe(false);
    expect(filterMatch(limb('head'), { by: 'part', val: 'head' })).toBe(true);
    expect(filterMatch(corpse(), { by: 'state', val: 'dead' })).toBe(true);
    expect(filterMatch({ kind: 'stick', body: makeBody() }, { by: 'state', val: 'healthy' })).toBe(true);
  });
});
