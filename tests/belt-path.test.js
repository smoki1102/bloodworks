import { describe, it, expect, beforeEach } from 'vitest';
import { boot, put } from './helpers.js';
import { S, blds } from '../src/core/state.js';
import { buildBeltPath, planBeltPath } from '../src/core/belt-path.js';
import { bldAtCell } from '../src/core/grid.js';
import { costOf, undo } from '../src/core/placement.js';

const belts = () => blds.filter((b) => b.t === 'belt');

describe('Bandstrecke', () => {
  beforeEach(() => boot());

  it('plant eine gerade Strecke mit Kosten pro neuer Zelle', () => {
    const plan = planBeltPath(10, 20, 13, 20);
    expect(plan.reason).toBeNull();
    expect(plan.cells.map((c) => c.dir)).toEqual([0, 0, 0, 0]);
    expect(plan.cost).toBe(4 * costOf('belt'));
  });

  it('plant eine L-Strecke und setzt die Richtungen um die Ecke', () => {
    const plan = planBeltPath(10, 20, 12, 22);
    expect(plan.reason).toBeNull();
    expect(plan.cells.map((c) => [c.x, c.y])).toEqual([
      [10, 20],
      [11, 20],
      [12, 20],
      [12, 21],
      [12, 22],
    ]);
    expect(plan.cells.map((c) => c.dir)).toEqual([0, 0, 1, 1, 1]);
  });

  it('nimmt den freien Knick, wenn der erste blockiert ist', () => {
    put('bin', 11, 20);
    const plan = planBeltPath(10, 20, 12, 22);
    expect(plan.reason).toBeNull();
    expect(plan.cells.map((c) => [c.x, c.y])).toEqual([
      [10, 20],
      [10, 21],
      [10, 22],
      [11, 22],
      [12, 22],
    ]);
  });

  it('lehnt eine Strecke komplett ab, wenn eine Zelle belegt ist', () => {
    put('bin', 11, 20);
    const before = S.money;
    const plan = buildBeltPath(10, 20, 12, 20);
    expect(plan.reason).toMatch(/^Blockiert: /);
    expect(S.money).toBe(before);
    expect(belts().length).toBe(0);
  });

  it('erkennt Schleifenbildung am Ende der Strecke', () => {
    put('belt', 12, 20, { dir: 2 });
    expect(planBeltPath(10, 20, 11, 20).reason).toBe('Schleifenbildung');
  });

  it('meldet Ziele außerhalb der Fabrik und zu wenig Geld', () => {
    expect(planBeltPath(10, 20, 200, 20).reason).toBe('Außerhalb der Fabrik');
    S.money = 0;
    expect(planBeltPath(10, 20, 13, 20).reason).toMatch(/^Zu teuer: /);
  });

  it('baut alles auf einmal und zieht genau die Kosten ab', () => {
    const before = S.money;
    const plan = buildBeltPath(10, 20, 13, 20);
    expect(plan.reason).toBeNull();
    expect(belts().length).toBe(4);
    expect(S.money).toBe(before - plan.cost);
    undo();
    expect(belts().length).toBe(0);
    expect(S.money).toBe(before);
  });

  it('übernimmt bestehende Bänder ohne Kosten und dirigiert sie um', () => {
    put('belt', 11, 20, { dir: 1 });
    const before = S.money;
    const plan = buildBeltPath(10, 20, 12, 20);
    expect(plan.reason).toBeNull();
    expect(plan.cost).toBe(2 * costOf('belt'));
    expect(S.money).toBe(before - plan.cost);
    expect(bldAtCell(11, 20).dir).toBe(0);
    expect(belts().length).toBe(3);
  });
});
