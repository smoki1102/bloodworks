import { UPG } from '../config/upgrade-defs.js';
import { S } from '../core/state.js';
import { buyUpgrade, upgCost, upgLevel } from '../core/upgrades.js';
import { $, fmt } from '../utils/helpers.js';

export let lastRes = null;

export function renderResearch() {
  const el = $('research');
  if (!el || el.classList.contains('hide')) return;
  const rows = UPG.map((u) => {
    const lv = upgLevel(u.id),
      cost = upgCost(u),
      maxed = cost === null,
      poor = cost !== null && S.blood < cost;
    return `<div class="upg${maxed ? ' max' : ''}">
      <div class="r1"><span class="g">${u.g}</span><span class="nm">${u.n}</span>
        <span class="lv">${lv} / ${u.max}</span></div>
      <div class="ds">${u.d}</div>
      <div class="r2">
        <div class="pips">${Array.from({ length: u.max }, (_, i) =>
          `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</div>
        <button data-upg="${u.id}" ${maxed || poor ? 'disabled' : ''}>
          ${maxed ? 'Maximal' : cost + ' Blut'}
        </button>
      </div></div>`;
  }).join('');
  const html = `<div class="resHead">FORSCHUNG · <b>${fmt(S.blood)}</b> Blut verfügbar
    <button class="close" data-a="closeRes" title="Schließen">✕</button></div>${rows}`;
  if (html !== lastRes) {
    lastRes = html;
    el.innerHTML = html;
  }
}

export function toggleResearch() {
  const el = $('research');
  el.classList.toggle('hide');
  if (!el.classList.contains('hide')) {
    lastRes = null;
    renderResearch();
  }
}

document.addEventListener('click', (e) => {
  const buy = e.target.closest('[data-upg]');
  if (buy) {
    buyUpgrade(buy.dataset.upg);
    lastRes = null;
    renderResearch();
    return;
  }
  if (e.target.closest('[data-a="closeRes"]')) toggleResearch();
});
