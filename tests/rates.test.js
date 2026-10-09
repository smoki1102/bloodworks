import { describe, it, expect, beforeEach } from 'vitest';
import { S, freshState, setState } from '../src/core/state.js';
import { resetRates, ratePerMin, rateWindow, stepRates } from '../src/core/rates.js';

describe('Raten (Statistik)', () => {
  beforeEach(() => {
    setState(freshState());
    resetRates();
  });

  it('bildet sauber eine Rate pro Minute über das Zeitfenster', () => {
    S.t = 0;
    S.stats.kills = 0;
    stepRates();
    S.t = 30;
    S.stats.kills = 30;
    stepRates();
    expect(rateWindow()).toBe(30);
    expect(ratePerMin('kills')).toBeCloseTo(60, 5);
  });

  it('liefert ohne Messpunkte 0', () => {
    S.t = 5;
    stepRates();
    expect(ratePerMin('kills')).toBe(0);
    expect(rateWindow()).toBe(0);
  });

  it('hält nur ein rollierendes Fenster von höchstens 60 s', () => {
    for (let t = 0; t <= 120; t++) {
      S.t = t;
      S.stats.sold = t;
      stepRates();
    }
    expect(rateWindow()).toBeLessThanOrEqual(60);
    expect(ratePerMin('sold')).toBeCloseTo(60, 5);
  });

  it('misst nur spielzeit-basiert, nicht pro Aufruf', () => {
    S.t = 0;
    stepRates();
    S.t = 0;
    stepRates();
    S.t = 0;
    stepRates();
    expect(ratePerMin('kills')).toBe(0);
    S.t = 60;
    S.stats.kills = 6;
    stepRates();
    expect(ratePerMin('kills')).toBeCloseTo(6, 5);
    expect(rateWindow()).toBe(60);
  });
});
