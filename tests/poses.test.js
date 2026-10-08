import { describe, it, expect, afterEach } from 'vitest';
import {
  POSES,
  REST,
  TAU,
  cycle,
  moving,
  pose,
  pressStroke,
  spin,
  swing,
} from '../src/render/anim/poses.js';
import { setReducedMotion } from '../src/core/effects.js';

const KINDS = ['spike', 'press', 'blade', 'schleuder'];

describe('Posen (ohne Canvas)', () => {
  afterEach(() => setReducedMotion(null));

  it('kennt genau die vier Maschinenposen', () => {
    expect(Object.keys(POSES).sort()).toEqual([...KINDS].sort());
    expect(Object.keys(REST).sort()).toEqual([...KINDS].sort());
  });

  it('liefert je Maschine numerische Posenwerte', () => {
    for (const kind of KINDS) {
      const p = pose(kind, 1.234, { prog: 0.2 });
      expect(p, kind).toBeTruthy();
      const vals = Object.values(p);
      expect(vals.length).toBeGreaterThan(0);
      for (const v of vals) expect(typeof v).toBe('number');
    }
  });

  it('gibt für unbekannte Geräte null', () => {
    expect(pose('belt', 1)).toBeNull();
    expect(pose('gibtEsNicht', 1)).toBeNull();
  });

  it('dreht die Walze gleichmäßig (spin ist linear)', () => {
    expect(spin(0, 3)).toBe(0);
    expect(spin(1, 3)).toBe(3);
    expect(spin(2, 3) - spin(1, 3)).toBe(spin(1, 3) - spin(0, 3));
    expect(pose('spike', 2).angle).toBe(6);
  });

  it('schwingt die Klinge periodisch mit fester Amplitude', () => {
    expect(swing(0, 8, 0.25)).toBeCloseTo(0, 10);
    expect(swing(TAU / 32, 8, 0.25)).toBeCloseTo(0.25, 10);
    expect(swing(TAU / 8, 8, 0.25)).toBeCloseTo(0, 10);
    const period = TAU / 8;
    for (const t of [0.1, 0.37, 1.2]) {
      expect(swing(t + period, 8, 0.25)).toBeCloseTo(swing(t, 8, 0.25), 10);
    }
  });

  it('fährt den Pressenhub als Dreieck 0→1→0', () => {
    expect(pressStroke(0)).toBeCloseTo(0, 10);
    expect(pressStroke(0.35)).toBeCloseTo(0.5, 10);
    expect(pressStroke(0.7)).toBeCloseTo(1, 10);
    expect(pressStroke(1.05)).toBeCloseTo(0.5, 10);
    expect(pressStroke(1.4)).toBeCloseTo(0, 10);
    for (const p of [0, 0.2, 0.6, 1.1]) {
      expect(pressStroke(p + 1.4)).toBeCloseTo(pressStroke(p), 10);
    }
  });

  it('bleibt im Hub stets zwischen 0 und 1', () => {
    for (let i = 0; i <= 28; i++) {
      const v = pressStroke(i * 0.05);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it('cycle ist periodisch und auf 0..1 normiert', () => {
    expect(cycle(0, 2)).toBe(0);
    expect(cycle(1, 2)).toBe(0.5);
    expect(cycle(2, 2)).toBe(0);
    expect(cycle(-0.5, 2)).toBe(0.75);
  });

  it('nutzt die Ruhepose bei still, unabhängig von der Zeit', () => {
    for (const kind of KINDS) {
      expect(pose(kind, 0, { still: true })).toEqual(REST[kind]);
      expect(pose(kind, 99.5, { still: true })).toEqual(REST[kind]);
    }
  });

  it('respektiert reduzierte Bewegung in moving()', () => {
    setReducedMotion(false);
    expect(moving(true, true)).toBe(true);
    expect(moving(false, true)).toBe(false);
    setReducedMotion(true);
    expect(moving(true, true)).toBe(false);
    expect(moving(true, true)).toBe(false);
  });
});
