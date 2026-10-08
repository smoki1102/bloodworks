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
import { $ } from './utils/helpers.js';

let lastTS = 0,
  hudTimer = 0,
  tutTimer = 0;
function loop(ts) {
  const dt = Math.min(0.05, (ts - lastTS) / 1000 || 0);
  lastTS = ts;
  if (S.running) {
    let rem = dt * S.speed;
    while (rem > 0) {
      const s = Math.min(rem, 0.033);
      tick(s);
      rem -= s;
    }
  }
  render();
  ambient(dt);
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
requestAnimationFrame(loop);

/* Entwickler-Galerie: nur mit `?ui` / `?gallery` (siehe ui/gallery.js). */
const params =
  typeof location !== 'undefined' ? new URLSearchParams(location.search) : null;
if (params && (params.has('ui') || params.has('gallery')))
  openGallery(params.has('ui') ? 'ui' : 'gallery');
