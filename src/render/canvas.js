import { $ } from '../utils/helpers.js';
import { CANVAS } from '../config/palette.js';

/**
 * Gemeinsamer Zeichenkontext. Separat ausgelagert, damit Maschinen-Module ihn
 * importieren können, ohne einen Import-Zyklus mit `renderer.js` zu bilden.
 */
export const cv = $('cv');
export const ctx = cv.getContext('2d');

/** Canvas-Palette – kanonisch in `config/palette.js` (CANVAS). */
export const C = CANVAS;
