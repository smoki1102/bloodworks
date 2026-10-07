import { DEF } from '../config/building-defs.js';
import { partPoints } from '../core/parts.js';
import {
  BRANCHES,
  branchOf,
  buySkill,
  skillCost,
  skillDef,
  skillLv,
  skillMaxed,
  skillReady,
} from '../core/skill.js';
import { bloodTotal } from '../core/pipes.js';
import { $, fmt } from '../utils/helpers.js';

let lastSkill = null;

/* Layout des Netzes: Äste als Zeilen, Knoten nach Voraussetzungstiefe. */
const NODE_W = 240,
  STEP_X = 280,
  ROW_H = 170,
  Y0 = 34,
  X0 = 20,
  ANCHOR = 34;

const depths = new Map();
function depthOf(n, guard = 0) {
  if (depths.has(n.id)) return depths.get(n.id);
  let d = 0;
  if (n.req?.length && guard < 8) {
    d =
      1 +
      Math.max(
        ...n.req.map(([id]) => {
          const p = skillDef(id);
          return p ? depthOf(p, guard + 1) : 0;
        }),
      );
  }
  depths.set(n.id, d);
  return d;
}
const rowOf = (br) => Math.max(0, BRANCHES.findIndex((b) => b.id === br));

const findAny = (id) => BRANCHES.flatMap((b) => branchOf(b.id)).find((n) => n.id === id) || null;

function reqText(n) {
  return n.req
    .map(([id, lv]) => {
      const node = findAny(id);
      return (node ? node.n : id) + ' ' + lv;
    })
    .join(', ');
}

function nodeHtml(n, x, y) {
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
  const state = maxed ? 'max' : !ready ? 'lock' : poor ? '' : 'can';
  const cls = ['upg node snode', state].filter(Boolean).join(' ');
  return `<div class="${cls}" style="left:${x}px;top:${y}px">
    <div class="r1"><span class="nm">${n.n}</span><span class="lv">${lv} / ${n.max}</span></div>
    <div class="ds">${n.d}</div>
    ${unlock ? `<div class="unlock">Schaltet frei: ${unlock}</div>` : ''}
    <div class="r2"><div class="pips">${pips}</div>${btn}</div>
  </div>`;
}

/** Skill-Netz als Diagramm: Knoten an ihrer Position, Kanten zu den Voraussetzungen. */
export function renderSkill() {
  const el = $('fNet');
  if (!el || el.classList.contains('hide')) return;
  const nodes = [];
  const edges = [];
  let maxX = 0;
  BRANCHES.forEach((br, ri) => {
    const y = Y0 + ri * ROW_H;
    const cur =
      br.cur === 'blood'
        ? `${fmt(bloodTotal())} Blut`
        : `${partPoints()} Teile`;
    nodes.push(
      `<div class="brTag" style="left:${X0}px;top:${y - 20}px">${br.n}<span>${cur} · ${br.d}</span></div>`,
    );
    for (const n of branchOf(br.id)) {
      const d = depthOf(n);
      const x = X0 + d * STEP_X;
      maxX = Math.max(maxX, x + NODE_W);
      nodes.push(nodeHtml(n, x, y));
      for (const [rid, lv] of n.req || []) {
        const r = skillDef(rid);
        if (!r) continue;
        const rRow = rowOf(r.br);
        const x1 = X0 + depthOf(r) * STEP_X + NODE_W,
          y1 = Y0 + rRow * ROW_H + ANCHOR;
        const x2 = x,
          y2 = y + ANCHOR;
        const mx = x1 + Math.max(14, (x2 - x1) / 2);
        edges.push(
          `<path d="M${x1} ${y1} H${mx} V${y2} H${x2}"/>`,
          lv > 1
            ? `<text x="${mx}" y="${(y1 + y2) / 2 - 4}" text-anchor="middle">×${lv}</text>`
            : '',
        );
      }
    }
  });
  const w = maxX + 40,
    h = Y0 + BRANCHES.length * ROW_H;
  const html = `<div class="snet" style="width:${w}px;height:${h}px">
    <svg class="sline" width="${w}" height="${h}">${edges.join('')}</svg>
    ${nodes.join('')}</div>`;
  if (html !== lastSkill) {
    lastSkill = html;
    el.innerHTML = html;
  }
}

export const skillPaneHidden = () => !$('fNet') || $('fNet').classList.contains('hide');

document.addEventListener('click', (e) => {
  const buy = e.target.closest('[data-skill]');
  if (buy) {
    buySkill(buy.dataset.skill);
    lastSkill = null;
    renderSkill();
  }
});
