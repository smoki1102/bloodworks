import { UPG } from '../config/upgrade-defs.js';
import { partPoints } from '../core/parts.js';
import { bloodTotal } from '../core/pipes.js';
import { S } from '../core/state.js';
import { buyUpgrade, upgCost, upgLevel } from '../core/upgrades.js';
import { $, fmt } from '../utils/helpers.js';
import { iconSvg } from '../render/icons.js';
import { renderSkill } from './skill.js';

export let lastRes = null;
let tab = 'net';

export const forschungOpen = () => !$('forschung').classList.contains('hide');
export const forschungTab = () => tab;

function setTab(next) {
  tab = next === 'upg' ? 'upg' : 'net';
  $('fNet').classList.toggle('hide', tab !== 'net');
  $('fUpg').classList.toggle('hide', tab !== 'upg');
  for (const b of $('forschung').querySelectorAll('[data-ftab]'))
    b.classList.toggle('on', b.dataset.ftab === tab);
}

/** Fenster öffnen (Tab wechseln, wenn es schon offen ist). */
export function openForschung(which = tab) {
  const opening = !forschungOpen();
  $('forschung').classList.remove('hide');
  setTab(which);
  S.skillSeen = true;
  renderForschung();
  return opening;
}

export function closeForschung() {
  $('forschung').classList.add('hide');
}

export function renderResearch() {
  const el = $('fUpg');
  if (!el || el.classList.contains('hide')) return;
  const rows = UPG.map((u) => {
    const lv = upgLevel(u.id),
      cost = upgCost(u),
      maxed = cost === null,
      poor = cost !== null && bloodTotal() < cost;
    return `<div class="upg${maxed ? ' max' : ''}">
      <div class="r1"><span class="g">${iconSvg(u.icon)}</span><span class="nm">${u.n}</span>
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
  if (rows !== lastRes) {
    lastRes = rows;
    el.innerHTML = rows;
  }
}

/** Kopfzeile + aktiver Reiter des Forschungsfensters. */
export function renderForschung() {
  if (!forschungOpen()) return;
  const b = $('fBlood'),
    p = $('fParts');
  if (b) b.textContent = fmt(bloodTotal());
  if (p) p.textContent = fmt(partPoints());
  if (tab === 'net') renderSkill();
  else renderResearch();
}

document.addEventListener('click', (e) => {
  const buy = e.target.closest('[data-upg]');
  if (buy) {
    buyUpgrade(buy.dataset.upg);
    lastRes = null;
    renderForschung();
    return;
  }
  const t = e.target.closest('[data-ftab]');
  if (t) {
    setTab(t.dataset.ftab);
    renderForschung();
  }
});
