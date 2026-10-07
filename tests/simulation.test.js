import { describe, it, expect, beforeEach } from 'vitest';
import { freshState, initSim, setState } from '../src/core/state.js';
import { addBuilding, canPlace, removeBuilding } from '../src/core/placement.js';
import { tick } from '../src/core/simulation.js';
import { buyUpgrade, upgEff } from '../src/core/upgrades.js';
import { questStep } from '../src/core/quests.js';
import { BASE_CAP, TANK_CAP } from '../src/config/constants.js';
import * as state from '../src/core/state.js';

function setupWorld() {
  setState(freshState());
  initSim();
  for (let c = 3; c <= 12; c++) addBuilding('belt', c, true);
  addBuilding('spawn', 3, true);
}

describe('Platzierung', () => {
  beforeEach(setupWorld);

  it('Spikes brauchen durchgehendes Band darunter', () => {
    expect(canPlace('spike', 6)).toBe(true);
    expect(canPlace('spike', 20)).toBe(false);
  });
  it('Kauf zieht Geld ab und scheitert bei zu wenig Geld', () => {
    const before = state.S.money;
    expect(addBuilding('spike', 6)).not.toBeNull();
    expect(state.S.money).toBe(before - 160);
    state.S.money = 0;
    expect(addBuilding('press', 8)).toBeNull();
  });
  it('Belegte Felder sind gesperrt', () => {
    addBuilding('spike', 6, true);
    expect(canPlace('press', 7)).toBe(false);
  });
});

describe('Simulation', () => {
  beforeEach(setupWorld);

  it('Bluttanks erhöhen die Kapazität', () => {
    addBuilding('tank', 14, true);
    tick(0.03);
    expect(state.S.bloodCap).toBe(BASE_CAP + TANK_CAP);
  });
  it('Eine Spikes-Walze erledigt Sticks', () => {
    addBuilding('spike', 6, true);
    for (let i = 0; i < 700; i++) tick(0.033);
    expect(state.S.kills).toBeGreaterThan(0);
  });
  it('Sticks fahren permanent sitzend auf Stühlen am Band', () => {
    for (let i = 0; i < 200; i++) tick(0.033);
    const riders = state.sticks.filter((s) => s.state === 'ride');
    expect(riders.length).toBeGreaterThan(0);
    const x0 = riders[0].x;
    for (let i = 0; i < 20; i++) tick(0.033);
    expect(state.sticks.find((s) => s.state === 'ride' && s.x > x0 + 10)).toBeTruthy();
  });
  it('Eine Bandlücke wirft Sticks dynamisch ab', () => {
    const b = state.blds.find((x) => x.t === 'belt' && x.col === 8);
    removeBuilding(b);
    for (let i = 0; i < 500; i++) tick(0.033);
    expect(state.S.ejected).toBeGreaterThan(0);
  });
  it('Der Abschleuderer schleudert Sticks vom Band', () => {
    addBuilding('schleuder', 8, true);
    for (let i = 0; i < 500; i++) tick(0.033);
    expect(state.S.ejected).toBeGreaterThan(0);
  });
});

describe('Forschung und Aufträge', () => {
  beforeEach(setupWorld);

  it('Forschung kostet Blut und erhöht die Bandgeschwindigkeit', () => {
    state.S.blood = 200;
    buyUpgrade('drive');
    expect(state.S.blood).toBe(140);
    expect(upgEff('speed')).toBeCloseTo(1.12);
  });
  it('Ein erreichtes Ziel zahlt die Belohnung aus', () => {
    state.S.kills = 10;
    const done = questStep();
    expect(done).not.toBeNull();
    expect(done.reward).toBe(150);
    expect(state.S.quest).toBe(1);
  });
});

describe('Warenflüsse', () => {
  beforeEach(() => {
    setupWorld();
    state.S.gore = 0;
    state.S.money = 20000;
  });

  it('Container leert Blut auf den Boden statt in den Tank', () => {
    addBuilding('spike', 6, true);
    addBuilding('bin', 13, true);
    for (let i = 0; i < 900; i++) tick(0.033);
    expect(state.S.blood).toBe(0);
    expect(state.floorBlood.reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
  });
  it('Abfluss ohne angeschlossenen Tank puffert nur', () => {
    addBuilding('spike', 6, true);
    addBuilding('bin', 13, true);
    addBuilding('drain', 16, true);
    addBuilding('tank', 17, true);
    addBuilding('drain', 20, true);
    for (let i = 0; i < 900; i++) tick(0.033);
    const d = state.blds.find((b) => b.t === 'drain' && b.col === 16);
    const alone = state.blds.find((b) => b.t === 'drain' && b.col === 20);
    expect(d.link).toBe('ok');
    expect(alone.link).toBe('none');
    expect(state.S.blood).toBeGreaterThan(0);
    expect(alone.buf).toBe(0);
  });
  it('Blutmarkt verkauft nur mit Tank direkt darunter', () => {
    addBuilding('tank', 10, true);
    addBuilding('market', 10, true);
    addBuilding('tank', 15, true);
    addBuilding('market', 20, true);
    state.S.blood = 500;
    for (let i = 0; i < 400; i++) tick(0.033);
    const withTank = state.blds.find((b) => b.t === 'market' && b.col === 10);
    const without = state.blds.find((b) => b.t === 'market' && b.col === 20);
    expect(withTank.link).toBe('ok');
    expect(without.link).toBe('none');
    expect(state.S.sold).toBeGreaterThan(0);
  });
  it('Ofen zieht Leichen aus dem angrenzenden Container', () => {
    addBuilding('spike', 6, true);
    addBuilding('bin', 13, true);
    addBuilding('oven', 11, true);
    for (let i = 0; i < 900; i++) tick(0.033);
    const oven = state.blds.find((b) => b.t === 'oven');
    expect(oven.outCount).toBeGreaterThan(0);
    expect(state.S.energy).toBeGreaterThan(0);
  });
});
