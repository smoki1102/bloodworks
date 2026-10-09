import { describe, it, expect, beforeEach } from 'vitest';
import { boot } from './helpers.js';
import { S, blds } from '../src/core/state.js';
import { addBuilding } from '../src/core/placement.js';
import {
  blueprintCost,
  captureBlueprint,
  pasteBlueprint,
  pasteReason,
  rotateBlueprint,
} from '../src/core/blueprint.js';

/** Kleine Ecke aus Band + Maschine, um sie zu kopieren. */
function corner() {
  addBuilding('belt', 10, 10, { free: true, dir: 0 });
  addBuilding('spike', 11, 10, { free: true, dir: 0 });
}

describe('Baupläne (Blueprint)', () => {
  beforeEach(() => boot());

  it('fasst Gebäude im Rechteck zusammen und normalisiert den Ursprung', () => {
    corner();
    const bp = captureBlueprint({ x0: 10, y0: 10, x1: 11, y1: 10 });
    expect(bp.w).toBe(2);
    expect(bp.h).toBe(1);
    expect(bp.cells).toHaveLength(2);
    expect(bp.cells.map((c) => [c.dx, c.dy, c.t])).toEqual([
      [0, 0, 'belt'],
      [1, 0, 'spike'],
    ]);
    expect(blueprintCost(bp)).toBe(20 + 160);
  });

  it('liefert null, wenn nichts markiert wurde', () => {
    corner();
    expect(captureBlueprint({ x0: 40, y0: 40, x1: 45, y1: 45 })).toBe(null);
  });

  it('setzt den ganzen Plan ein und bucht die Gesamtkosten', () => {
    corner();
    const bp = captureBlueprint({ x0: 10, y0: 10, x1: 11, y1: 10 });
    S.money = 1000;
    const before = blds.length;
    expect(pasteBlueprint(bp, 20, 20)).toBe(null);
    expect(blds.length).toBe(before + 2);
    expect(S.money).toBe(1000 - 180);
    expect(blds.find((b) => b.t === 'belt' && b.x === 20 && b.y === 20)).toBeTruthy();
    expect(blds.find((b) => b.t === 'spike' && b.x === 21 && b.y === 20)).toBeTruthy();
  });

  it('setzt nichts ein, wenn eine Zelle blockiert ist (alles oder nichts)', () => {
    corner();
    const bp = captureBlueprint({ x0: 10, y0: 10, x1: 11, y1: 10 });
    addBuilding('bin', 21, 20, { free: true });
    S.money = 1000;
    const before = blds.length;
    expect(pasteReason(bp, 20, 20)).toBe('Blockiert');
    expect(pasteBlueprint(bp, 20, 20)).toBe('Blockiert');
    expect(blds.length).toBe(before);
    expect(S.money).toBe(1000);
  });

  it('meldet zu wenig Geld', () => {
    corner();
    const bp = captureBlueprint({ x0: 10, y0: 10, x1: 11, y1: 10 });
    S.money = 10;
    expect(pasteReason(bp, 20, 20)).toBe('Zu teuer: 180 €');
  });

  it('meldet einen Platz außerhalb der Fabrik', () => {
    corner();
    const bp = captureBlueprint({ x0: 10, y0: 10, x1: 11, y1: 10 });
    S.money = 1000;
    expect(pasteReason(bp, 200, 200)).toBe('Außerhalb der Fabrik');
  });

  it('dreht Maße und Richtungen 90° im Uhrzeigersinn', () => {
    S.money = 1000;
    addBuilding('belt', 10, 10, { free: true, dir: 1 });
    addBuilding('belt', 14, 10, { free: true, dir: 5 });
    const bp = captureBlueprint({ x0: 10, y0: 10, x1: 14, y1: 10 });
    const rot = rotateBlueprint(bp);
    expect(rot.w).toBe(bp.h);
    expect(rot.h).toBe(bp.w);
    const dirs = rot.cells.map((c) => c.dir);
    expect(dirs).toContain(2); // 1 -> 2
    expect(dirs).toContain(6); // 5 -> 6
  });

  it('rotiert Diagonalrichtung 7 zurück auf 4', () => {
    addBuilding('belt', 10, 10, { free: true, dir: 7 });
    const bp = captureBlueprint({ x0: 10, y0: 10, x1: 10, y1: 10 });
    expect(rotateBlueprint(bp).cells[0].dir).toBe(4);
  });
});
