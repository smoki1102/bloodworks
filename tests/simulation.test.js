import { describe, it, expect, beforeEach } from 'vitest';
import { boot, put, run } from './helpers.js';
import { S, corpses, sticks, nets, floorBlood } from '../src/core/state.js';
import { addFloorBlood } from '../src/core/effects.js';
import { idx } from '../src/core/grid.js';
import { questStep, questProgress } from '../src/core/quests.js';
import { buyUpgrade, upgEff, upgLevel } from '../src/core/upgrades.js';
import { beltSpeed } from '../src/core/belts.js';
import { bloodTotal } from '../src/core/pipes.js';
import { partPoints } from '../src/core/parts.js';
import { CORPSE_FLOOR_LIFE } from '../src/config/constants.js';

/** Komplette Kette: Eingang → Band → Spikes → Band → Container, Blut bis zum Markt. */
function fullLine() {
  put('spawn', 10, 20, { dir: 0 });
  put('belt', 12, 20, { dir: 0 });
  put('spike', 13, 20, { dir: 0 });
  put('belt', 15, 20, { dir: 0 });
  put('bin', 16, 20);
  put('drain', 16, 63);
  put('pipe', 17, 63);
  put('pipe', 18, 63);
  put('tank', 19, 63);
  put('pipe', 21, 63);
  put('market', 22, 63);
}

describe('Simulation', () => {
  beforeEach(() => boot());

  it('liefert die volle Kette vom Stick bis zum Blutverkauf', () => {
    fullLine();
    run(60);
    expect(S.spawned).toBeGreaterThan(3);
    expect(S.kills).toBeGreaterThan(0);
    expect(partPoints()).toBeGreaterThan(0);
    expect(bloodTotal()).toBeGreaterThanOrEqual(0);
    expect(nets.length).toBe(1);
    expect(nets[0].cap).toBeGreaterThan(0);
    expect(S.sold).toBeGreaterThan(0);
    expect(S.money).toBeGreaterThan(90000);
    expect(S.escaped).toBe(0);
    expect(Object.values(S.parts).reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
  });

  it('ohne Energie läuft nichts', () => {
    fullLine();
    S.energyMax = 0;
    S.energy = 0;
    run(10);
    expect(S.spawned).toBe(0);
    expect(S.kills).toBe(0);
    expect(S.pf).toBe(0);
    S.energyMax = 200;
    S.energy = 120;
    run(10);
    expect(S.spawned).toBeGreaterThan(0);
  });

  it('Bodenblut sickert nach unten', () => {
    put('bin', 10, 20);
    addFloorBlood(10, 20, 11);
    run(0.5);
    let below = 0;
    for (let y = 21; y < 64; y++) below += floorBlood[idx(10, y)];
    expect(below).toBeGreaterThan(0);
    expect(floorBlood[idx(10, 20)]).toBeLessThan(11);
  });

  it('Bodenblut breitet sich am Boden seitlich aus', () => {
    addFloorBlood(10, 63, 11);
    run(1);
    expect(floorBlood[idx(11, 63)] + floorBlood[idx(9, 63)]).toBeGreaterThan(0);
  });

  it('Leichen laufen über den Boden und verwesen', () => {
    corpses.push({
      kind: 'corpse',
      x: 100,
      y: 64 * 48,
      vx: 0,
      vy: 0,
      rot: 0,
      state: 'floor',
      missing: [],
      bleed: 0.6,
      life: 0.4,
    });
    const x0 = corpses[0].x;
    run(0.5);
    expect(corpses.length).toBe(0);
    expect(x0).toBe(100);
    expect(floorBlood[idx(2, 63)] + floorBlood[idx(3, 63)]).toBeGreaterThan(0);
  });

  it('Gore 0 verschont die Gliedmaßen', () => {
    S.gore = 0;
    put('spawn', 10, 20, { dir: 0 });
    put('belt', 12, 20, { dir: 0 });
    put('spike', 13, 20, { dir: 0 });
    put('belt', 15, 20, { dir: 0 });
    put('bin', 16, 20);
    run(30);
    expect(S.kills).toBeGreaterThan(0);
    expect(partPoints()).toBe(0);
  });

  it('Forschung wirkt sofort auf Tempo und Kapazität', () => {
    const v0 = beltSpeed();
    S.blood = 0;
    buyUpgrade('drive');
    expect(upgLevel('drive')).toBe(0);
    S.blood = 60;
    buyUpgrade('drive');
    expect(upgLevel('drive')).toBe(1);
    expect(upgEff('speed')).toBeCloseTo(1.12, 5);
    expect(beltSpeed()).toBeGreaterThan(v0);
    S.blood = 10;
    buyUpgrade('tank');
    expect(upgLevel('tank')).toBe(0);
    S.blood = 50;
    buyUpgrade('tank');
    expect(upgEff('tank')).toBe(100);
  });

  it('schreitet die Auftragskette fort', () => {
    expect(questProgress()).toBe(0);
    S.kills = 10;
    expect(questProgress()).toBe(10);
    const m0 = S.money;
    const q = questStep();
    expect(q).toBeTruthy();
    expect(S.quest).toBe(1);
    expect(S.money).toBe(m0 + q.reward);
    expect(questStep()).toBeNull();
    expect(sticks.length).toBe(0);
    void CORPSE_FLOOR_LIFE;
  });
});
