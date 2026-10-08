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

/**
 * Layout des Netzes: Äste als Blöcke untereinander, Spalten nach
 * Voraussetzungstiefe, Unterzeilen (Slots) für mehrere Knoten derselben
 * Tiefe – Knoten überlappen dadurch nie. `NODE_H` muss zur CSS-Höhe von
 * `.snode` passen, sonst rutschen Kacheln in die nächste Zeile.
 */
const NODE_W = 240,
  NODE_H = 140,
  STEP_X = 280,
  SLOT_H = 150,
  TAG_H = 30,
  BR_GAP = 18,
  Y0 = 16,
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
    btn = `<button disabled data-tip="Benötigt: ${reqText(n)}">Gesperrt</button>`;
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

/**
 * Reines Layout des Skill-Netzes (kein DOM): Knotenpositionen, Ast-Tags und
 * Kanten. Gleiche Tiefe im selben Ast wird in Unterzeilen gestapelt; die
 * Ast-Höhe wächst mit der Zahl dieser Slots.
 * @returns {{w:number,h:number,nodes:Array,tags:Array,edges:Array}}
 */
export function skillLayout() {
  depths.clear();
  const nodes = [];
  const tags = [];
  const pos = new Map();
  let maxX = 0;
  let y = Y0;
  for (const br of BRANCHES) {
    const list = branchOf(br.id).slice().sort((a, b) => depthOf(a) - depthOf(b));
    const slots = new Map();
    const used = new Map();
    let maxSlots = 0;
    for (const n of list) {
      const d = depthOf(n);
      let free = used.get(d);
      if (!free) used.set(d, (free = new Set()));
      let slot = slots.get(n.req?.[0]?.[0]);
      if (slot === undefined || free.has(slot)) {
        slot = 0;
        while (free.has(slot)) slot++;
      }
      free.add(slot);
      slots.set(n.id, slot);
      if (slot + 1 > maxSlots) maxSlots = slot + 1;
      const nx = X0 + d * STEP_X;
      const ny = y + TAG_H + slot * SLOT_H;
      if (nx + NODE_W > maxX) maxX = nx + NODE_W;
      const box = { id: n.id, def: n, x: nx, y: ny, w: NODE_W, h: NODE_H };
      nodes.push(box);
      pos.set(n.id, box);
    }
    tags.push({ id: br.id, x: X0, y });
    y += TAG_H + maxSlots * SLOT_H + BR_GAP;
  }
  const edges = [];
  for (const box of nodes) {
    for (const [rid, lv] of box.def.req || []) {
      const p = pos.get(rid);
      if (!p) continue;
      const x1 = p.x + NODE_W,
        y1 = p.y + ANCHOR,
        x2 = box.x,
        y2 = box.y + ANCHOR;
      edges.push({ x1, y1, x2, y2, mx: x1 + Math.max(14, (x2 - x1) / 2), ym: (y1 + y2) / 2 - 4, lv });
    }
  }
  return { w: maxX + 40, h: y - BR_GAP, nodes, tags, edges };
}

/** Skill-Netz als Diagramm: Knoten an ihrer Position, Kanten zu den Voraussetzungen. */
export function renderSkill() {
  const el = $('fNet');
  if (!el || el.classList.contains('hide')) return;
  const L = skillLayout();
  const tags = BRANCHES.map((br, i) => {
    const t = L.tags[i];
    const cur =
      br.cur === 'blood'
        ? `${fmt(bloodTotal())} Blut`
        : `${partPoints()} Teile`;
    return `<div class="brTag" style="left:${t.x}px;top:${t.y}px">${br.n}<span>${cur} · ${br.d}</span></div>`;
  }).join('');
  const lines = L.edges
    .map(
      (e) =>
        `<path d="M${e.x1} ${e.y1} H${e.mx} V${e.y2} H${e.x2}"/>` +
        (e.lv > 1 ? `<text x="${e.mx}" y="${e.ym}" text-anchor="middle">×${e.lv}</text>` : ''),
    )
    .join('');
  const boxes = L.nodes.map((b) => nodeHtml(b.def, b.x, b.y)).join('');
  const html = `<div class="snet" style="width:${L.w}px;height:${L.h}px">
    <svg class="sline" width="${L.w}" height="${L.h}">${lines}</svg>
    ${tags}${boxes}</div>`;
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
