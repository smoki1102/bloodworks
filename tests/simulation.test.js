import { describe, it, expect, beforeEach } from 'vitest';
import { freshState, initSim, setState } from '../src/core/state.js';
import { addBuilding, canPlace } from '../src/core/placement.js';
import { tick } from '../src/core/simulation.js';
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
});
