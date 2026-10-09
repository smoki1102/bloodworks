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
import { updateQuest } from './ui/quests.js';
import { openGallery } from './ui/gallery.js';
import { installPerfHook, perfBegin, perfCount, perfEnd, perfFrame, setPerf } from './utils/perf.js';
import { $ } from './utils/helpers.js';

let lastTS = 0,
  hudTimer = 0,
  tutTimer = 0;

/** Ein Frame: Simulation (variable Schrittweite), Darstellung, HUD-Takt. */
export function frame(ts) {
  perfFrame(ts);
  const dt = Math.min(0.05, (ts - lastTS) / 1000 || 0);
  lastTS = ts;
  if (S.running) {
    perfBegin('sim');
    let rem = dt * S.speed;
    while (rem > 0) {
      const s = Math.min(rem, 0.033);
      tick(s);
      rem -= s;
      perfCount('tick');
    }
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
