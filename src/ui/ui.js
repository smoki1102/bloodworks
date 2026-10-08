import { CATS, DEF } from '../config/building-defs.js';
import { TUT_STEPS } from '../config/tutorial-defs.js';
import { CELL, PH, PW, SAVE_KEY, SAVE_VER } from '../config/constants.js';
import { buildBeltPath } from '../core/belt-path.js';
import { resetBloodBounds, setReducedMotion, toast } from '../core/effects.js';
import { bldAt, inGrid } from '../core/grid.js';
import {
  addBuilding,
  clearHistory,
  costOf,
  isUnlocked,
  originOf,
  placeReason,
  undo,
} from '../core/placement.js';
import { netHasTank, bloodCapTotal, bloodTotal } from '../core/pipes.js';
import { partPoints } from '../core/parts.js';
import { giveSkillGift } from '../core/skill.js';
import { S, blds, corpses, freshState, initSim, nets, setState } from '../core/state.js';
import { cv, panBy, resize, screenToWorld, zoomAt } from '../render/renderer.js';
import { iconSvg } from '../render/icons.js';
import { UI, CSS_MAP, METRICS } from '../config/palette.js';
import { initTooltip } from './tooltip.js';
import { $, fmt } from '../utils/helpers.js';
import {
  inspectorAction,
  inspectorField,
  renderInspector,
  sellSelected,
  toggleSelected,
} from './inspector.js';
import { closeForschung, forschungOpen, openForschung } from './research.js';
export { renderInspector };

/* ------------------------------ Karten / HUD ------------------------------ */

export function renderTabs() {
  $('tabs').innerHTML = CATS.map(
    ([k, l], i) =>
      `<button data-c="${k}" class="${S.cat === k ? 'on' : ''}">${i + 1} · ${l}</button>`,
  ).join('');
}

export let lastList = null;
export function renderList() {
  const html = Object.entries(DEF)
    .filter(([, d]) => d.cat === S.cat)
    .map(([k, d]) => {
      const locked = !isUnlocked(k);
      const cost = costOf(k);
      const tags = [
        locked ? '<span class="lock">Skill: ' + d.unlock + '</span>' : '',
        d.e ? d.e.toFixed(2) + ' E/s' : '',
      ]
        .filter(Boolean)
        .join(' · ');
      return `<div class="card${S.tool === k ? ' sel' : ''}${S.money < cost ? ' poor' : ''}${
        locked ? ' locked' : ''
      }${S.tutItem === k ? ' tut' : ''}" data-t="${k}" role="button" tabindex="0" aria-pressed="${
        S.tool === k
      }">
    <div class="r1"><span class="g">${iconSvg(d.icon)}</span><span class="nm">${d.n}</span><span class="cost">${
      cost ? cost + ' €' : '—'
    }</span></div>
    <div class="ds">${d.d}</div><div class="tag">${tags}</div></div>`;
    })
    .join('');
  if (html !== lastList) {
    lastList = html;
    $('list').innerHTML = html;
  }
}

export function renderHUD() {
  $('rMoney').textContent = fmt(S.money);
  $('rBlood').textContent = fmt(bloodTotal());
  $('rBloodCap').textContent = ' /' + fmt(bloodCapTotal());
  $('rParts').textContent = fmt(partPoints());
  $('rEnergy').textContent = fmt(S.energy);
  $('rAsh').textContent = fmt(S.ash);
  $('rCorpse').textContent = corpses.length + blds.reduce((a, b) => a + b.items.length, 0);
  $('rEnergyBox').classList.toggle('bad', S.pf < 0.4);
  $('stats').textContent = `SEKTOR 01 · ${S.stats.kills} erledigt · ${S.stats.ejected} abgeworfen · ${
    S.stats.escaped
  } entkommen · ${fmt(S.stats.sold)} Blut verkauft`;
}

/* -------------------------------- Tutorial -------------------------------- */

const covers = (b, x, y) =>
  x >= b.x && x < b.x + b.spanW && y >= b.y && y < b.y + b.spanH;

function stepDone(st) {
  const n = st.need || {};
  if (n.bld)
    return blds.some(
      (b) => b.t === n.bld && (n.cells || []).some(([x, y]) => covers(b, x, y)),
    );
  if (n.custom === 'pipes')
    return nets.some(
      (n2) =>
        netHasTank(n2) &&
        n2.blds.some((b) => b.t === 'market') &&
        n2.blds.some((b) => b.t === 'drain'),
    );
  if (n.custom === 'run') return S.running && S.t > 1;
  if (n.custom === 'reserve') return blds.some((b) => b.reserveTouched);
  if (n.custom === 'skill') return Object.keys(S.skill.lv).length > 0;
  return false;
}

let lastHint = null;
export function updateTutorial() {
  const showSkip = S.tut === 'on' && S.tutStep < TUT_STEPS.length;
  if ($('btnSkipTut').hidden === showSkip) $('btnSkipTut').hidden = !showSkip;
  if (S.tut !== 'on') {
    const el = $('hint');
    if (el.style.display !== 'none') el.style.display = 'none';
    S.tutCells = [];
    S.tutItem = null;
    lastHint = null;
    return;
  }
  while (S.tutStep < TUT_STEPS.length && stepDone(TUT_STEPS[S.tutStep])) S.tutStep++;
  if (S.tutStep >= TUT_STEPS.length) {
    if (!S.done) {
      S.done = true;
      S.money += 400;
      toast('Tutorial abgeschlossen · +400 €', 'good');
    }
    S.tutCells = [];
    S.tutItem = null;
    $('hint').style.display = 'none';
    lastHint = null;
    return;
  }
  const st = TUT_STEPS[S.tutStep];
  if (st.gift) giveSkillGift();
  S.tutCells = st.cells || [];
  S.tutItem = st.item || null;
  if (st.item && DEF[st.item] && S.cat !== DEF[st.item].cat) {
    S.cat = DEF[st.item].cat;
    renderTabs();
    lastList = null;
    renderList();
  }
  const el = $('hint');
  el.style.display = 'block';
  const html = `<span class="n">${S.tutStep + 1}/${TUT_STEPS.length}</span>${st.text}`;
  if (html !== lastHint) {
    lastHint = html;
    el.innerHTML = html;
  }
}

/* --------------------------------- Bauen --------------------------------- */

export function toWorld(e) {
  const r = cv.getBoundingClientRect();
  return screenToWorld(e.clientX - r.left, e.clientY - r.top);
}

function placeAt(t, cx, cy) {
  const o = originOf(t, cx, cy);
  const reason = placeReason(t, o.x, o.y, S.dir);
  if (reason) {
    toast(reason, 'bad');
    return null;
  }
  const b = addBuilding(t, o.x, o.y, { dir: S.dir });
  if (b) {
    S.sel = b;
    renderInspector();
    updateTutorial();
  }
  return b;
}

/** Werkzeug abwählen – bricht auch eine laufende Bandwahl ab. */
function clearTool() {
  S.tool = null;
  S.beltFrom = null;
}

/**
 * Bandstrecke: erster Klick setzt den Start, zweiter das Ende (oder ein Drag
 * loslassen). Klick auf die Startzelle bricht ab.
 */
function beltAt(cx, cy) {
  if (!inGrid(cx, cy)) return;
  const from = S.beltFrom;
  if (!from) {
    S.beltFrom = { x: cx, y: cy };
    return;
  }
  if (from.x === cx && from.y === cy) {
    S.beltFrom = null;
    toast('Bandwahl abgebrochen', 'good');
    return;
  }
  const plan = buildBeltPath(from.x, from.y, cx, cy);
  if (plan.reason) {
    toast(plan.reason, 'bad');
    return;
  }
  S.beltFrom = null;
  toast(
    `Förderband: ${plan.cells.length} Zellen · −${plan.cost} €`,
    'good',
  );
  updateTutorial();
}

/* -------------------------------- Eingabe -------------------------------- */

let panning = null,
  moved = 0,
  lastCell = null;

cv.addEventListener('pointerdown', (e) => {
  cv.setPointerCapture(e.pointerId);
  const p = toWorld(e);
  S.wx = p.x;
  S.wy = p.y;
  S.down = true;
  moved = 0;
  if (e.button === 1 || (e.button === 0 && !S.tool)) {
    panning = { x: e.clientX, y: e.clientY };
    lastCell = null;
  } else if (e.button === 0 && S.tool) {
    const cx = Math.floor(p.x / CELL),
      cy = Math.floor(p.y / CELL);
    if (S.tool === 'belt') {
      lastCell = null;
      beltAt(cx, cy);
      return;
    }
    lastCell = cx + ':' + cy;
    placeAt(S.tool, cx, cy);
  } else if (e.button === 2) {
    clearTool();
    S.sel = null;
    renderList();
    renderInspector();
  }
});

cv.addEventListener('pointermove', (e) => {
  const p = toWorld(e);
  S.wx = p.x;
  S.wy = p.y;
  if (panning) {
    panBy(e.clientX - panning.x, e.clientY - panning.y);
    panning = { x: e.clientX, y: e.clientY };
    moved += 1;
    return;
  }
  if (!S.down || !S.tool || S.tool === 'belt') return;
  const d = DEF[S.tool];
  if (!d || d.w > 1 || d.h > 1) return;
  const cx = Math.floor(p.x / CELL),
    cy = Math.floor(p.y / CELL);
  const key = cx + ':' + cy;
  if (key === lastCell) return;
  lastCell = key;
  placeAt(S.tool, cx, cy);
});

addEventListener('pointerup', (e) => {
  const wasPan = panning && moved < 4;
  panning = null;
  S.down = false;
  if (S.tool === 'belt' && S.beltFrom && e.target === cv) {
    const p = toWorld(e);
    const cx = Math.floor(p.x / CELL),
      cy = Math.floor(p.y / CELL);
    if (cx !== S.beltFrom.x || cy !== S.beltFrom.y) beltAt(cx, cy);
    lastCell = null;
    return;
  }
  if (wasPan && e.target === cv) {
    const p = toWorld(e);
    S.sel = bldAt(p.x, p.y);
    renderInspector();
  }
  lastCell = null;
});

cv.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    const r = cv.getBoundingClientRect();
    zoomAt(e.clientX - r.left, e.clientY - r.top, e.deltaY < 0 ? 1.12 : 1 / 1.12);
  },
  { passive: false },
);

cv.addEventListener('contextmenu', (e) => e.preventDefault());

const modalOpen = () => !$('modal').classList.contains('hide');
const typing = () =>
  ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName);

addEventListener('keydown', (e) => {
  if (modalOpen() || typing()) return;
  if (e.code === 'Space') {
    e.preventDefault();
    toggleRun();
  } else if (e.key === 'Escape') {
    clearTool();
    S.sel = null;
    renderList();
    renderInspector();
  } else if ((e.key === 'Delete' || e.key === 'Backspace') && S.sel) {
    e.preventDefault();
    sellSelected(S.sel);
    lastList = null;
    renderList();
  } else if ((e.key === 'z' || e.key === 'Z') && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    undo();
    lastList = null;
    renderList();
    renderInspector();
    renderHUD();
  } else if (e.key === 'e' || e.key === 'E') {
    toggleSelected();
  } else if (e.key === 'r' || e.key === 'R') {
    if (S.tool) {
      S.dir = (S.dir + 1) & 3;
      toast('Richtung: ' + ['Rechts', 'Runter', 'Links', 'Hoch'][S.dir], 'good');
    }
  } else if (e.key === 'k' || e.key === 'K') {
    document.querySelector('[data-a="openForschung"]')?.click();
  } else if (e.key >= '1' && e.key <= '5') {
    S.cat = CATS[+e.key - 1][0];
    clearTool();
    renderTabs();
    lastList = null;
    renderList();
  } else if (e.key.startsWith('Arrow')) {
    e.preventDefault();
    const s = 140;
    if (e.key === 'ArrowLeft') panBy(s, 0);
    else if (e.key === 'ArrowRight') panBy(-s, 0);
    else if (e.key === 'ArrowUp') panBy(0, s);
    else panBy(0, -s);
  } else if (e.key === '+' || e.key === '=') {
    zoomAt(vwHalf(), vhHalf(), 1.15);
  } else if (e.key === '-') {
    zoomAt(vwHalf(), vhHalf(), 1 / 1.15);
  }
});
const vwHalf = () => cv.getBoundingClientRect().width / 2;
const vhHalf = () => cv.getBoundingClientRect().height / 2;

/* ------------------------------ Klick-Aktionen ------------------------------ */

let skillPaused = false;

/** Baukarte wählen/abwählen (Click und Enter/Space). */
function selectCard(t) {
  if (!isUnlocked(t)) return toast('Im Skill-Tree freizuschalten', 'bad');
  S.tool = S.tool === t ? null : t;
  S.beltFrom = null;
  S.sel = null;
  lastList = null;
  renderList();
  renderInspector();
}

document.addEventListener('click', (e) => {
  const tab = e.target.closest('[data-c]');
  if (tab) {
    S.cat = tab.dataset.c;
    clearTool();
    renderTabs();
    lastList = null;
    renderList();
    return;
  }
  const card = e.target.closest('.card');
  if (card) {
    selectCard(card.dataset.t);
    return;
  }
  const act = e.target.closest('[data-a]');
  if (!act) return;
  const a = act.dataset.a;
  if (['close', 'sell', 'clean', 'toggle', 'resSet'].includes(a)) {
    inspectorAction(a);
    lastList = null;
    renderList();
    renderHUD();
  } else if (a === 'openForschung') {
    if (forschungOpen()) closeForschungUI();
    else openForschungUI('net');
  } else if (a === 'closeForschung') closeForschungUI();
});

document.addEventListener('change', (e) => {
  const f = e.target.closest('[data-f]');
  if (f) inspectorField(f.dataset.f, f.value);
});

// Enter/Space auf fokussierter Baukarte – Abfangen vor dem globalen Space-Handler.
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.code !== 'Space') return;
  const card = document.activeElement?.closest?.('.card');
  if (!card) return;
  e.preventDefault();
  e.stopPropagation();
  selectCard(card.dataset.t);
});

/* --------------------------------- Lauf --------------------------------- */

/** Play-/Pause-Button: eigenes Icon + Label. */
function setPlayBtn(label, running) {
  $('btnPlay').innerHTML = `${iconSvg(running ? 'pause' : 'play')} ${label}`;
}

/** Statische Glyphen in index.html (z. B. Energie-HUD) durch Icons ersetzen. */
function initIcons() {
  const e = $('rEnergyIcon');
  if (e) e.innerHTML = iconSvg('energy');
  for (const b of document.querySelectorAll('[data-icon]'))
    b.innerHTML = iconSvg(b.dataset.icon);
}

/** Kanonische Tokens aus `palette.js` auf `:root` schreiben (JS = Quelle). */
function applyTokens() {
  const root = document.documentElement;
  if (!root || !root.style || !root.style.setProperty) return;
  for (const [name, key] of Object.entries(CSS_MAP))
    root.style.setProperty('--' + name, UI[key]);
  for (const [name, val] of Object.entries(METRICS))
    root.style.setProperty('--' + name, val);
}

export function toggleRun() {
  S.running = !S.running;
  setPlayBtn(S.running ? 'Pause' : S.t > 0 ? 'Weiter' : 'Start', S.running);
  updateTutorial();
}
$('btnPlay').onclick = toggleRun;
document.querySelectorAll('#speed button').forEach(
  (b) =>
    (b.onclick = () => {
      S.speed = +b.dataset.s;
      document
        .querySelectorAll('#speed button')
        .forEach((x) => x.classList.toggle('on', x === b));
    }),
);
document.querySelectorAll('#goreSeg button').forEach(
  (b) =>
    (b.onclick = () => {
      S.gore = +b.dataset.g;
      document
        .querySelectorAll('#goreSeg button')
        .forEach((x) => x.classList.toggle('on', x === b));
    }),
);

/* ------------------------------- Einstellungen ------------------------------- */

const setPop = $('setPop');

function syncGoreSegs() {
  for (const seg of [$('goreSeg'), $('goreSegGame')]) {
    if (!seg) continue;
    for (const b of seg.querySelectorAll('button'))
      b.classList.toggle('on', +b.dataset.g === S.gore);
  }
}

function toggleSetPop(force) {
  const open = force !== undefined ? force : setPop.classList.contains('hide');
  setPop.classList.toggle('hide', !open);
  if (open) syncGoreSegs();
}

$('btnSettings').onclick = (e) => {
  e.stopPropagation();
  toggleSetPop();
};

document.addEventListener('click', (e) => {
  if (
    !setPop.classList.contains('hide') &&
    !e.target.closest('#setPop') &&
    !e.target.closest('#btnSettings')
  )
    toggleSetPop(false);
});

$('goreSegGame').querySelectorAll('button').forEach(
  (b) =>
    (b.onclick = () => {
      S.gore = +b.dataset.g;
      syncGoreSegs();
    }),
);

$('optMotion').onchange = () => setReducedMotion($('optMotion').checked);

/* ------------------------------- Speichern ------------------------------- */

export function save(silent) {
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        v: SAVE_VER,
        money: S.money,
        energy: S.energy,
        blood: S.blood,
        ash: S.ash,
        t: S.t,
        gore: S.gore,
        stats: { ...S.stats },
        quest: S.quest,
        up: S.up,
        skill: S.skill,
        gift: S.gift,
        done: S.done,
        tut: S.tut,
        tutStep: S.tutStep,
        cam: { x: S.cam.x, y: S.cam.y, z: S.cam.z },
        blds: blds.map((b) => ({
          t: b.t,
          x: b.x,
          y: b.y,
          dir: b.dir,
          spanH: b.spanH,
          dirt: b.dirt,
          on: b.on,
          buf: b.buf,
          target: b.target,
          filter: b.filter,
          reserve: b.reserve,
          reserveTouched: b.reserveTouched,
          items: b.items.map((i) => ({
            kind: i.kind,
            part: i.part,
            rot: i.rot,
            chair: i.chair,
            missing: i.missing,
            p: i.p,
            lat: i.lat,
            held: i.held,
            prog: i.prog,
            bleed: i.bleed,
            life: i.life,
            body: i.body
              ? {
                  hp: i.body.hp,
                  bleeding: i.body.bleeding,
                  lost: i.body.lost,
                  hits: i.body.hits,
                  limbs: i.body.limbs,
                  php: i.body.php,
                }
              : undefined,
          })),
        })),
      }),
    );
    if (!silent) toast('Gespeichert', 'good');
  } catch (err) {
    if (!silent) toast('Speichern fehlgeschlagen', 'bad');
  }
}

/**
 * Forschungsfenster öffnen/schließen – pausiert die Simulation, solange es
 * offen ist (wie früher der Skill-Tree).
 */
function openForschungUI(which) {
  openForschung(which);
  if (S.running) {
    skillPaused = true;
    toggleRun();
  }
}
function closeForschungUI() {
  if (!forschungOpen()) return;
  closeForschung();
  // Nur fortsetzen, wenn wir selbst pausiert haben und noch pausiert ist.
  const resume = skillPaused && !S.running;
  skillPaused = false;
  if (resume) toggleRun();
}

/**
 * Aufsteigende Migration älterer Spielstände auf SAVE_VER. Pro Version ein
 * Schritt; `raw` wird an Ort und Stelle verändert. Rückgabe: migrierter Rohdaten
 * oder `null`, wenn die Migration nicht möglich ist.
 */
function migrate(raw) {
  if (raw.v === 9) {
    raw.stats = {
      spawned: 0,
      kills: raw.kills || 0,
      sold: raw.sold || 0,
      escaped: raw.escaped || 0,
      ejected: raw.ejected || 0,
      caught: raw.caught || 0,
      toggled: raw.toggled || 0,
      partsSold: 0,
      schleuder: 0,
    };
    delete raw.kills;
    delete raw.sold;
    delete raw.escaped;
    delete raw.ejected;
    delete raw.caught;
    delete raw.toggled;
    raw.v = 10;
  }
  if (raw.v === 10) {
    // Paket v0.12.0: Gebäude-Footprints wachsen. Alte Layouts würden beim Laden
    // überlappen und still verworfen – daher dokumentierter Fabrik-Reset:
    // Fortschritt (Geld, Quests, Stats, Skills) bleibt, die Gebäude nicht.
    raw.blds = [];
    raw.v = 11;
  }
  if (raw.v !== SAVE_VER) return null;
  return raw;
}

export const hasSave = () => {
  try {
    const r = JSON.parse(localStorage.getItem(SAVE_KEY));
    return !!r && migrate(r) !== null;
  } catch (err) {
    return false;
  }
};

export function load() {
  let raw;
  try {
    raw = JSON.parse(localStorage.getItem(SAVE_KEY));
  } catch {
    /* leerer oder kaputter Speicherstand */
  }
  if (!raw) return toast('Kein Spielstand', 'bad');
  raw = migrate(raw);
  if (!raw) return toast('Spielstand nicht kompatibel', 'bad');
  if (S.running) toggleRun();
  initSim();
  resetBloodBounds();
  Object.assign(S, {
    money: raw.money,
    energy: raw.energy,
    blood: raw.blood,
    ash: raw.ash,
    t: raw.t,
    gore: raw.gore,
    stats: {
      spawned: 0,
      kills: raw.stats?.kills || 0,
      sold: raw.stats?.sold || 0,
      escaped: raw.stats?.escaped || 0,
      ejected: raw.stats?.ejected || 0,
      caught: raw.stats?.caught || 0,
      toggled: raw.stats?.toggled || 0,
      partsSold: raw.stats?.partsSold || 0,
      schleuder: raw.stats?.schleuder || 0,
    },
    quest: raw.quest || 0,
    up: raw.up && raw.up.lv ? raw.up : { lv: {} },
    skill: raw.skill && raw.skill.lv ? raw.skill : { lv: {} },
    gift: !!raw.gift,
    done: raw.done !== false,
    tut: raw.tut || 'off',
    tutStep: raw.tutStep || 0,
    cam: raw.cam || S.cam,
    tool: null,
    beltFrom: null,
    sel: null,
    tutCells: [],
    tutItem: null,
  });
  for (const o of raw.blds || []) {
    if (!DEF[o.t]) continue;
    const b = addBuilding(o.t, o.x, o.y, { free: true, dir: o.dir });
    if (!b) continue;
    b.dirt = o.dirt || 0;
    b.on = o.on !== false;
    b.buf = o.buf || 0;
    b.target = o.target || '';
    b.filter = o.filter || { by: 'part', val: 'head' };
    b.reserve = o.reserve || null;
    b.reserveTouched = !!o.reserveTouched;
    b.items = (o.items || []).map((i) => ({ ...i }));
  }
  S.netDirty = true;
  renderTabs();
  lastList = null;
  renderList();
  renderInspector();
  renderHUD();
  updateTutorial();
  toast('Spielstand geladen', 'good');
  return true;
}

$('btnSave').onclick = () => save();
$('btnLoad').onclick = load;
applyTokens();
initIcons();
initTooltip();
setPlayBtn('Start', false);
$('btnSkipTut').onclick = () => {
  S.tut = 'off';
  S.done = true;
  lastHint = null;
  updateTutorial();
  renderList();
  toast('Tutorial übersprungen', 'good');
};
$('btnContinue').onclick = () => {
  if (load() !== false) $('modal').classList.add('hide');
};
$('btnStart').onclick = () => startGame('tutorial');
$('btnFree').onclick = () => startGame('free');
$('btnNew').onclick = () => {
  if (S.running) toggleRun();
  $('modal').classList.remove('hide');
  $('btnContinue').hidden = !hasSave();
  $('btnStart').textContent = 'Tutorial starten';
};
setInterval(() => {
  if (S.running) save(true);
}, 60000);
addEventListener('beforeunload', () => {
  if (S.t > 0) save(true);
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && S.running) toggleRun();
});

/* --------------------------------- Start --------------------------------- */

function startGame(mode) {
  newGame(mode);
  $('modal').classList.add('hide');
  setPlayBtn('Start', false);
  if (mode === 'tutorial') toast('Tutorial: folge den grünen Markierungen', 'good');
}

export function setupWorld(mode = 'free') {
  if (mode === 'tutorial') return;
  addBuilding('spawn', 10, 56, { free: true, dir: 0 });
  for (let x = 12; x <= 16; x++) addBuilding('belt', x, 56, { free: true, dir: 0 });
  addBuilding('bin', 17, 56, { free: true, dir: 0 });
}

export function newGame(mode = 'tutorial') {
  const g = S ? S.gore : 100;
  setState(freshState());
  S.gore = g;
  S.tut = mode === 'tutorial' ? 'on' : 'off';
  S.done = mode !== 'tutorial';
  S.cam.x = PW / 2;
  S.cam.y = PH / 2;
  clearHistory();
  initSim();
  resetBloodBounds();
  setupWorld(mode);
  lastList = null;
  lastHint = null;
  skillPaused = false;
  closeForschung();
  renderTabs();
  renderList();
  renderInspector();
  renderHUD();
  updateTutorial();
  resize();
}
