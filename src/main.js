import './styles/main.css';
import { ambient } from './core/effects.js';
import { tick } from './core/simulation.js';
import { S, freshState, initSim, setState } from './core/state.js';
import { cv, render, resize } from './render/renderer.js';
import {
  hasSave,
  renderHUD,
  renderInspector,
  renderList,
  renderTabs,
  setupWorld,
  updateTutorial,
} from './ui/ui.js';
import { renderForschung } from './ui/research.js';
import { renderStats } from './ui/stats.js';
import { updateQuest } from './ui/quests.js';
import { openGallery } from './ui/gallery.js';
import { installPerfHook, perfBegin, perfCount, perfEnd, perfFrame, setPerf } from './utils/perf.js';
import { $ } from './utils/helpers.js';

let lastTS = 0,
  hudTimer = 0,
  tutTimer = 0,
  simAcc = 0;

/** Feste Simulations-Schrittweite (nähert das alte 0,033-Chunking an). */
export const FIXED_DT = 1 / 30;
/** Notbremse: nach einem Hänger wird nicht stundenlang aufgeholt. */
export const MAX_STEPS = 10;
/** Obergrenze für die gemessene Framezeit (Resize, Tab im Hintergrund). */
export const MAX_DT = 0.05;

/** Ein Frame: Simulation in festen 1/30-s-Schritten, Darstellung, HUD-Takt. */
export function frame(ts) {
  perfFrame(ts);
  const dt = Math.min(MAX_DT, (ts - lastTS) / 1000 || 0);
  lastTS = ts;
  if (S.running) {
    perfBegin('sim');
    simAcc += dt * S.speed;
    let steps = 0;
    while (simAcc >= FIXED_DT && steps < MAX_STEPS) {
      tick(FIXED_DT);
      simAcc -= FIXED_DT;
      steps++;
      perfCount('tick');
    }
    if (steps === MAX_STEPS) simAcc = 0;
    perfEnd('sim');
  }
  perfBegin('render');
  render();
  perfEnd('render');
  ambient(dt);
  perfBegin('ui');
  if ((hudTimer -= dt) <= 0) {
    hudTimer = 0.12;
    renderHUD();
    renderList();
    renderInspector();
    renderForschung();
    renderStats();
  }
  if ((tutTimer -= dt) <= 0) {
    tutTimer = 0.4;
    updateTutorial();
    updateQuest();
  }
  perfEnd('ui');
}

function loop(ts) {
  frame(ts);
  requestAnimationFrame(loop);
}

setState(freshState());
initSim();
setupWorld('free');
$('btnContinue').hidden = !hasSave();
new ResizeObserver(resize).observe(cv.parentElement);
resize();
renderTabs();
renderList();
renderInspector();
renderHUD();
updateTutorial();

/* Entwickler-Galerie: nur mit `?ui` / `?gallery` (siehe ui/gallery.js). */
const params =
  typeof location !== 'undefined' ? new URLSearchParams(location.search) : null;
if (params && (params.has('ui') || params.has('gallery')))
  openGallery(params.has('ui') ? 'ui' : 'gallery');

/* Zeitmessung und Bench-Welt: nur mit `?perf` bzw. `?bench`
 * (siehe utils/perf.js und scripts/profile.mjs). */
if (params && (params.has('perf') || params.has('bench'))) {
  setPerf(true);
  installPerfHook();
  globalThis.__bwFrame = frame;
  globalThis.__bwS = S;
}

if (params && params.has('bench')) {
  /* Der Profiling-Treiber ruft `__bwFrame` selbst – die normale Schleife
   * darf dann nicht zusätzlich laufen, sonst wird doppelt simuliert.
   * `?bench=…&live` behält die rAF-Schleife (Echtzeitmessung mit Rasterisierung). */
  import('./dev/bench.js').then((m) => {
    m.buildBench(params.get('bench') || '');
    globalThis.__bwBenchReady = true;
  });
}
if (!params || !params.has('bench') || params.has('live'))
  requestAnimationFrame(loop);
