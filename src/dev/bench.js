/**
 * Dev-Bench (`?bench`): baut eine repräsentative Fabrik, startet das Spiel
 * und schaltet die Zeitmessung ein (`utils/perf.js`). Nur erreichbar, wenn
 * `main.js` mit `?bench` geladen wird – im normalen Spiel passiert nichts.
 *
 * Der Aufbau ist deterministisch, damit Vorher/Nachher-Messungen
 * (`scripts/profile.mjs`) dieselbe Szene vergleichen.
 */
import { DEF } from '../config/building-defs.js';
import { buildBeltPath } from '../core/belt-path.js';
import { addBuilding } from '../core/placement.js';
import { blds, S, sticks, corpses, parts, nets } from '../core/state.js';
import { cv } from '../render/renderer.js';
import { setPerf } from '../utils/perf.js';
import { $ } from '../utils/helpers.js';
import { newGame } from '../ui/ui.js';

const put = (t, x, y, dir = 0, fromDir) =>
  addBuilding(t, x, y, { free: true, dir, fromDir });
const belt = (x0, y0, x1, y1) => buildBeltPath(x0, y0, x1, y1);

/** Eingang → Band → Maschine → Weiche → Verkauf/Container (dx = Spaltenversatz). */
function line(y, mach, end, dx = 0) {
  put('spawn', 2 + dx, y, 0);
  belt(4 + dx, y, 6 + dx, y);
  put(mach, 7 + dx, y, 0);
  const ex = 7 + dx + DEF[mach].w;
  const ey = y + ((DEF[mach].h - 1) >> 1);
  belt(ex, ey, ex + 3, ey);
  const wx = ex + 4;
  put('weiche', wx, ey, 0);
  belt(wx + 1, ey, wx + 5, ey);
  put(end, wx + 6, ey, 0);
  put('belt', wx, ey + 1, 1);
  belt(wx, ey + 2, wx, ey + 3);
  put('bin', wx - 1, ey + 4, 0);
}

/** Zwei Quellen laufen in einer Zusammenführung zusammen. */
function mergeModule(y) {
  put('spawn', 50, y, 0);
  belt(52, y, 58, y);
  put('merge', 59, y, 0);
  put('spawn', 54, y + 6, 0);
  belt(56, y + 6, 58, y + 6);
  put('belt', 59, y + 6, 3, 0);
  belt(59, y + 5, 59, y + 1);
  belt(60, y, 64, y);
  put('oven', 65, y, 0);
}

/** Filter teilt nach Körperteil: Treffer zum Verkauf, Rest in den Container. */
function filterModule(y) {
  put('spawn', 50, y, 0);
  belt(52, y, 57, y);
  put('filter', 58, y, 0);
  belt(59, y, 62, y);
  put('shop', 63, y, 0);
  put('belt', 58, y + 1, 1);
  belt(58, y + 2, 58, y + 3);
  put('bin', 57, y + 4, 0);
}

/** Zwei Tanks, Abfluss, Markt und Generator an einem Netz. */
function pipeNet() {
  put('tank', 6, 40, 0); // Zellen 6–7, Zeilen 40–43
  put('bin', 16, 39, 0); // wirft Blut vor den Abfluss
  for (let x = 8; x <= 16; x++) put('pipe', x, 41, 0);
  put('drain', 17, 41, 0);
  put('pipe', 18, 41, 0);
  put('pipe', 19, 41, 0);
  put('market', 20, 40, 0);
  put('pipe', 21, 43, 0);
  put('gen', 20, 44, 0);
  put('tank', 6, 46, 0);
  for (let x = 8; x <= 19; x++) put('pipe', x, 47, 0);
  put('pipe', 19, 46, 0);
  put('pipe', 19, 45, 0);
  put('lab', 30, 41, 0);
}

const MACH = ['spike', 'press', 'blade', 'schleuder', 'spike'];

/**
 * @param {string} mode '' = Standard (5 Linien), 'big' = Stressszene mit
 *   fünf zusätzlichen Linien in einer zweiten Spalte (≈ doppelte Anlagengröße).
 */
export function buildBench(mode = '') {
  newGame('free');
  S.money = 999999;
  S.skill.lv = { prec_blade: 1, log_filter: 1, eco_shop: 1 };
  for (let i = 0; i < MACH.length; i++)
    line(4 + i * 6, MACH[i], i % 2 ? 'bin' : 'shop');
  mergeModule(4);
  filterModule(14);
  mergeModule(24);
  pipeNet();
  if (mode === 'big')
    for (let i = 0; i < MACH.length; i++)
      line(34 + i * 6, MACH[(i + 2) % MACH.length], i % 2 ? 'bin' : 'shop', 32);
  S.cam.x = (mode === 'big' ? 30 : 35) * 48;
  S.cam.y = (mode === 'big' ? 33 : 27) * 48;
  S.cam.z = mode === 'big' ? 0.6 : 0.7;
  S.tut = 'off';
  S.done = true;
  S.running = true;
  $('modal').classList.add('hide');
  setPerf(true);

  /* Kamera-Steuerung für `scripts/profile.mjs` (S wird bei newGame
   * neu gesetzt – der Zugriff muss deshalb über diese Funktion laufen). */
  globalThis.__bwCam = (x, y, z) => {
    S.cam.x = x;
    S.cam.y = y;
    S.cam.z = z;
  };

  /* Szenen-Diagnose für `scripts/profile.mjs`. */
  globalThis.__bwStats = () => {
    let items = 0;
    for (const b of blds) items += b.items ? b.items.length : 0;
    return {
      t: +S.t.toFixed(1),
      blds: blds.length,
      belts: blds.filter((b) => b.t === 'belt').length,
      items,
      sticks: sticks.length,
      corpses: corpses.length,
      parts: parts.length,
      nets: nets.length,
      spawned: S.stats.spawned,
      sold: S.stats.sold,
      money: Math.round(S.money),
      canvas: [cv.width, cv.height],
      cam: [Math.round(S.cam.x), Math.round(S.cam.y), +S.cam.z.toFixed(2)],
    };
  };
}
