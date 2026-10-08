import { describe, it, expect } from 'vitest';
import { clamp, fmt, lerp } from '../src/utils/helpers.js';

describe('helpers', () => {
  it('fmt gruppiert Tausender mit Punkt', () => {
    expect(fmt(0)).toBe('0');
    expect(fmt(999)).toBe('999');
    expect(fmt(1000)).toBe('1.000');
    expect(fmt(1600)).toBe('1.600');
    expect(fmt(9999)).toBe('9.999');
  });
  it('fmt kürzt große Zahlen mit deutschem Komma', () => {
    expect(fmt(10000)).toBe('10k');
    expect(fmt(12345)).toBe('12,3k');
    expect(fmt(123456)).toBe('123,5k');
    expect(fmt(999949)).toBe('999,9k');
    expect(fmt(999950)).toBe('1,0M');
    expect(fmt(1000000)).toBe('1,0M');
    expect(fmt(2500000)).toBe('2,5M');
  });
  it('fmt rundet ab (ganze Zahlen)', () => {
    expect(fmt(1999.9)).toBe('1.999');
  });
  it('clamp und lerp', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
    expect(lerp(0, 10, 0.5)).toBe(5);
  });
});
