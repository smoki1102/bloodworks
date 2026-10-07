import { DEF } from '../config/building-defs.js';
import { partPoints } from '../core/parts.js';
import {
  BRANCHES,
  branchOf,
  buySkill,
  skillCost,
  skillLv,
  skillMaxed,
  skillReady,
} from '../core/skill.js';
import { bloodTotal } from '../core/pipes.js';
import { S } from '../core/state.js';
import { $, fmt } from '../utils/helpers.js';

let lastSkill = null;

const findAny = (id) => BRANCHES.flatMap((b) => branchOf(b.id)).find((n) => n.id === id) || null;

function reqText(n) {
  return n.req
    .map(([id, lv]) => {
      const node = findAny(id);
      return (node ? node.n : id) + ' ' + lv;
    })
    .join(', ');
}

function nodeHtml(n) {
  const lv = skillLv(n.id);
  const maxed = skillMaxed(n);
  const ready = skillReady(n);
  const cost = skillCost(n);
  const poor =
    cost != null && (n.cur === 'blood' ? bloodTotal() < cost : partPoints() < cost);
  const unlock = (n.unlock || [])
    .map((t) => (DEF[t] ? DEF[t].n : t))
    .join(', ');
  const pips = Array.from(
    { length: n.max },
    (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`,
  ).join('');
  let btn;
  if (maxed) btn = `<button disabled>Maximal</button>`;
  else if (!ready)
    btn = `<button disabled title="Benötigt: ${reqText(n)}">Gesperrt</button>`;
  else
    btn = `<button data-skill="${n.id}" ${poor ? 'disabled' : ''}>${cost} ${n.cur === 'blood' ? 'Blut' : 'Teile'}</button>`;
  return `<div class="upg node${maxed ? ' max' : ''}${ready ? '' : ' lock'}">
    <div class="r1"><span class="nm">${n.n}</span><span class="lv">${lv} / ${n.max}</span></div>
    <div class="ds">${n.d}</div>
    ${unlock ? `<div class="unlock">Schaltet frei: ${unlock}</div>` : ''}
    <div class="r2"><div class="pips">${pips}</div>${btn}</div>
  </div>`;
}

export function renderSkill() {
  const el = $('skill');
  if (!el || el.classList.contains('hide')) return;
  const parts = S.parts;
  const body =
    BRANCHES.map((br) => {
      const cur =
        br.cur === 'blood'
          ? `${fmt(bloodTotal())} Blut`
          : `${partPoints()} Teile (Köpfe ${parts.head} · Torso ${parts.torso} · Arme ${parts.armL + parts.armR} · Beine ${parts.legL + parts.legR})`;
      return `<div class="brHead">${br.n}<span>${cur}</span></div>
        <div class="brDs">${br.d}</div>${branchOf(br.id).map(nodeHtml).join('')}`;
    }).join('');
  const html = `<div class="resHead">SKILL-TREE · <b>${fmt(bloodTotal())}</b> Blut · <b>${partPoints()}</b> Teile
    <button class="close" data-a="closeSkill" title="Schließen">✕</button></div>${body}`;
  if (html !== lastSkill) {
    lastSkill = html;
    el.innerHTML = html;
  }
}

export function toggleSkill() {
  const el = $('skill');
  if (!el) return;
  el.classList.toggle('hide');
  const open = !el.classList.contains('hide');
  if (open) {
    S.skillSeen = true;
    lastSkill = null;
    renderSkill();
  }
  const btn = $('btnSkill');
  if (btn) btn.classList.toggle('on', open);
}

document.addEventListener('click', (e) => {
  const buy = e.target.closest('[data-skill]');
  if (buy) {
    buySkill(buy.dataset.skill);
    lastSkill = null;
    renderSkill();
    return;
  }
  if (e.target.closest('[data-a="closeSkill"]')) toggleSkill();
  if (e.target.closest('[data-a="skill"]')) toggleSkill();
});
