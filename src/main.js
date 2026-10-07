import './styles/main.css';
import { ambient } from './core/effects.js';
import { tick } from './core/simulation.js';
import { S, freshState, initSim, setState } from './core/state.js';
import { cv, initBackground, render, resize } from './render/renderer.js';
import {
  hasSave,
  renderHUD,
  renderInspector,
  renderList,
  renderTabs,
  setupWorld,
  updateTutorial,
} from './ui/ui.js';
import { renderResearch } from './ui/research.js';
import { updateQuest } from './ui/quests.js';
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
    renderResearch();
  }
  if ((tutTimer -= dt) <= 0) {
    tutTimer = 0.4;
    updateTutorial();
    updateQuest();
  }
  requestAnimationFrame(loop);
}
initBackground();
setState(freshState());
initSim();
setupWorld();
$('btnContinue').hidden = !hasSave();
new ResizeObserver(resize).observe(cv.parentElement);
resize();
renderTabs();
renderList();
renderInspector();
renderHUD();
updateTutorial();
requestAnimationFrame(loop);
