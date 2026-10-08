import { describe, it, expect } from 'vitest';
import { CANVAS, CSS_MAP, METRICS, UI, rgba } from '../src/config/palette.js';

describe('Design-Tokens', () => {
  it('setzt alle Farb-Token', () => {
    for (const [k, v] of Object.entries(UI)) {
      expect(v, k).toBeTruthy();
      expect(typeof v, k).toBe('string');
    }
  });

  it('verweist in CSS_MAP nur auf vorhandene Farben', () => {
    for (const [css, key] of Object.entries(CSS_MAP))
      expect(UI[key], `--${css} → UI.${key}`).toBeTruthy();
  });

  it('füllt alle Maße-Token', () => {
    for (const [k, v] of Object.entries(METRICS)) {
      expect(typeof v, k).toBe('string');
      expect(v.length, k).toBeGreaterThan(0);
    }
  });

  it('enthält die im Plan genannten Token-Gruppen', () => {
    for (const k of ['sp1', 'sp6', 'r1', 'r3', 'shPop', 'shPanel', 'fontUi', 'fontTitle', 'durFast', 'durSlow'])
      expect(METRICS[k], k).toBeTruthy();
  });

  it('setzt die Canvas-Palette', () => {
    for (const k of ['bg', 'hall', 'panel', 'accent', 'blood100', 'glow'])
      expect(CANVAS[k], k).toBeTruthy();
  });

  it('wandelt Hex mit Deckkraft in rgba', () => {
    expect(rgba('#ff0000', 0.5)).toBe('rgba(255,0,0,0.5)');
    expect(rgba('#9fb52e', 1)).toBe('rgba(159,181,46,1)');
  });
});
