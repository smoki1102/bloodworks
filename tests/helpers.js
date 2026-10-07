import { freshState, initSim, setState, S } from '../src/core/state.js';
import { addBuilding } from '../src/core/placement.js';
import { tick } from '../src/core/simulation.js';

/** Frische Welt mit laufender Simulation. */
export function boot(over = {}) {
  setState(freshState());
  initSim();
  Object.assign(S, { running: true, gore: 100, money: 99999, energy: 120 }, over);
  return S;
}

/** Gebäude auf Zelle (x,y) setzen – mit allen Spielregeln (Kosten, Locks). */
export function put(t, x, y, opts = {}) {
  return addBuilding(t, x, y, opts);
}

/** Sekunden durchtakten. */
export function run(sec, dt = 0.033) {
  const n = Math.round(sec / dt);
  for (let i = 0; i < n; i++) tick(dt);
}

export const sum = (typed) => typed.reduce((a, b) => a + b, 0);
export const beltAt = (x, y) => {
  const b = put('belt', x, y, { dir: 0 });
  return b;
};
