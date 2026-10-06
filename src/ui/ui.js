import { BAND_LABEL, CATS, DEF } from '../config/building-defs.js';
import { SAVE_KEY } from '../config/constants.js';
import { toast } from '../core/effects.js';
import { addBuilding, bldAt, canPlace, has, sellBuilding } from '../core/placement.js';
import { S, blds, corpses, freshState, initSim, setState } from '../core/state.js';
import { cv, snapCol, vOffX, vOffY, vScale } from '../render/renderer.js';
import { $, clamp, fmt } from '../utils/helpers.js';

export function renderTabs() {
  $('tabs').innerHTML = CATS.map(
    ([k, l]) => `<button data-c="${k}" class="${S.cat === k ? 'on' : ''}">${l}</button>`,
  ).join('');
}
export let lastList = null;
export function renderList() {
  const html = Object.entries(DEF)
    .filter(([, d]) => d.cat === S.cat)
    .map(
      ([
        k,
        d,
      ]) => `<div class="card${S.tool === k ? ' sel' : ''}${S.money < d.cost ? ' poor' : ''}" data-t="${k}">
    <div class="r1"><span class="g">${d.g}</span><span class="nm">${d.n}</span><span class="cost">${d.cost ? d.cost + ' €' : '—'}</span></div>
    <div class="ds">${d.d}</div><div class="tag">${BAND_LABEL[d.band]}${d.e ? ' · ' + d.e.toFixed(2) + ' E/s' : ''}</div></div>`,
    )
    .join('');
  if (html !== lastList) {
    lastList = html;
    $('list').innerHTML = html;
  }
}
export function renderHUD() {
  $('rMoney').textContent = fmt(S.money);
  $('rBlood').textContent = fmt(S.blood);
  $('rBloodCap').textContent = ' /' + fmt(S.bloodCap);
  $('rEnergy').textContent = fmt(S.energy);
  $('rAsh').textContent = fmt(S.ash);
  $('rCorpse').textContent = corpses.length + blds.reduce((a, b) => a + b.items.length, 0);
  $('rEnergyBox').classList.toggle('bad', S.pf < 0.4);
  $('stats').textContent =
    `SEKTOR 01 · ${S.kills} erledigt · ${S.escaped} entkommen · ${fmt(S.sold)} Blut verkauft`;
}
export let lastInsp = null;
export function renderInspector() {
  const p = $('inspector'),
    b = S.sel;
  if (!b || !blds.includes(b)) {
    p.style.display = 'none';
    lastInsp = null;
    return;
  }
  p.style.display = 'block';
  const d = DEF[b.t],
    clean = clamp(100 - b.dirt, 0, 100),
    cost = Math.round(15 + b.dirt * 0.8);
  let st = 'Aktiv',
    cls = '';
  if (b.clean > 0) {
    st = 'Reinigung läuft';
    cls = 'warn';
  } else if (d.e > 0 && S.pf < 0.4) {
    st = 'Kein Strom';
    cls = 'err';
  } else if (b.dirt >= 70) {
    st = 'Verschmutzt';
    cls = 'warn';
  }
  const extra =
    b.t === 'bin'
      ? `<div class="kv"><span>Leichen</span><b>${b.items.length} / 9</b></div>`
      : b.t === 'oven' || b.t === 'acid'
        ? `<div class="kv"><span>Leichen</span><b>${b.items.length} / 3</b></div>`
        : b.t === 'tank'
          ? `<div class="kv"><span>Füllstand</span><b>${fmt(S.blood)} / ${fmt(S.bloodCap)}</b></div>`
          : '';
  const html = `<h3>${d.g} ${d.n}<button class="close" data-a="close" title="Schließen">✕</button></h3><div class="panel">
    <div class="kv"><span>Status</span><b class="${cls}">${st}</b></div>
    <div class="kv"><span>Sauberkeit</span><b>${clean.toFixed(0)}%</b></div>
    <div class="bar"><i style="width:${clean}%;background:${clean > 60 ? '#8f8f8f' : clean > 30 ? '#e0a040' : '#e5483a'}"></i></div>${extra}
    <div class="kv"><span>Verbrauch</span><b>${d.e ? d.e.toFixed(2) + ' E/s' : '—'}</b></div>
    <div class="acts"><button data-a="clean" ${b.dirt < 3 || b.clean > 0 ? 'disabled' : ''}>✦ Reinigen · ${cost} €</button>
    <button class="danger" data-a="sell">Verkaufen · +${Math.round(d.cost * 0.5)} €</button></div></div>`;
  if (html !== lastInsp) {
    lastInsp = html;
    p.innerHTML = html;
  }
}

export const TUT = [
  [
    'Baue eine <b>Spikes-Walze</b> oder <b>Presse</b> über dem Band (Halle).',
    () => has('spike') || has('press'),
  ],
  [
    'Reiße eine <b>Lücke ins Band</b> (Band verkaufen) und stelle im <b>Keller</b> einen <b>Container</b> darunter.',
    () => has('bin'),
  ],
  [
    'Baue im Keller einen <b>Abfluss</b> und einen <b>Bluttank daneben</b> – der Abfluss pumpt nur mit angeschlossenem Tank.',
    () => has('drain') && has('tank'),
  ],
  [
    'Baue im Obergeschoss einen <b>Blutmarkt</b> – er verkauft nur mit einem <b>Bluttank direkt darunter</b> (dieselben Spalten).',
    () => has('market'),
  ],
  ['Drücke <b>Start</b> und lass die Anlage laufen.', () => S.running || S.t > 1],
];
export let lastHint = null;
export function updateTutorial() {
  if (!S.done) {
    while (S.tutStep < TUT.length && TUT[S.tutStep][1]()) S.tutStep++;
    if (S.tutStep >= TUT.length) {
      S.done = true;
      S.money += 400;
      toast('Tutorial abgeschlossen · +400 €', 'good');
    }
  }
  const el = $('hint');
  if (S.done) {
    el.style.display = 'none';
    lastHint = null;
    return;
  }
  el.style.display = 'block';
  const html = `<span class="n">${S.tutStep + 1}</span>${TUT[S.tutStep][0]}`;
  if (html !== lastHint) {
    lastHint = html;
    el.innerHTML = html;
  }
}

/* Eingabe */
export function toWorld(e) {
  const r = cv.getBoundingClientRect();
  return { x: (e.clientX - r.left - vOffX) / vScale, y: (e.clientY - r.top - vOffY) / vScale };
}
export function tryPlaceAt(wx) {
  const t = S.tool,
    d = DEF[t],
    col = snapCol(wx, d.w);
  if (!canPlace(t, col))
    return toast(d.band === 'over' ? 'Braucht durchgehend Band darunter' : 'Kein Platz', 'bad');
  if (S.money < d.cost) return toast('Nicht genug Geld', 'bad');
  const b = addBuilding(t, col);
  if (b) {
    S.sel = b;
    renderInspector();
    updateTutorial();
  }
}
cv.addEventListener('pointerdown', (e) => {
  if (e.button === 2) return;
  cv.setPointerCapture(e.pointerId);
  const p = toWorld(e);
  S.mx = p.x;
  S.my = p.y;
  S.down = true;
  if (S.tool) tryPlaceAt(p.x);
  else {
    S.sel = bldAt(p.x, p.y);
    renderInspector();
  }
});
cv.addEventListener('pointermove', (e) => {
  const p = toWorld(e);
  S.mx = p.x;
  S.my = p.y;
  if (S.down && S.tool === 'belt') tryPlaceAt(p.x);
});
addEventListener('pointerup', () => {
  S.down = false;
});
cv.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  S.tool = null;
  S.sel = null;
  renderList();
  renderInspector();
});
addEventListener('keydown', (e) => {
  if (!$('modal').classList.contains('hide')) return;
  if (e.code === 'Space') {
    e.preventDefault();
    toggleRun();
  } else if (e.key === 'Escape') {
    S.tool = null;
    S.sel = null;
    renderList();
    renderInspector();
  } else if ((e.key === 'Delete' || e.key === 'Backspace') && S.sel) {
    e.preventDefault();
    sellBuilding(S.sel);
    renderList();
    renderInspector();
  } else if (e.key >= '1' && e.key <= '3') {
    S.cat = CATS[e.key - 1][0];
    S.tool = null;
    renderTabs();
    renderList();
  }
});
document.addEventListener('click', (e) => {
  const tab = e.target.closest('[data-c]');
  if (tab) {
    S.cat = tab.dataset.c;
    S.tool = null;
    renderTabs();
    renderList();
    return;
  }
  const card = e.target.closest('.card');
  if (card) {
    S.tool = S.tool === card.dataset.t ? null : card.dataset.t;
    S.sel = null;
    renderList();
    renderInspector();
    return;
  }
  const act = e.target.closest('[data-a]');
  if (!act) return;
  const a = act.dataset.a,
    b = S.sel;
  if (a === 'close') {
    S.sel = null;
    renderInspector();
  } else if (a === 'sell' && b) {
    sellBuilding(b);
    renderList();
    renderInspector();
  } else if (a === 'clean' && b && b.dirt >= 3) {
    const cost = Math.round(15 + b.dirt * 0.8);
    if (S.money < cost) return toast('Nicht genug Geld', 'bad');
    S.money -= cost;
    b.clean = 2;
    renderInspector();
    renderHUD();
  }
});

export function toggleRun() {
  S.running = !S.running;
  $('btnPlay').textContent = S.running ? '⏸ Pause' : '▶ ' + (S.t > 0 ? 'Weiter' : 'Start');
  updateTutorial();
}
$('btnPlay').onclick = toggleRun;
document.querySelectorAll('#speed button').forEach(
  (b) =>
    (b.onclick = () => {
      S.speed = +b.dataset.s;
      document.querySelectorAll('#speed button').forEach((x) => x.classList.toggle('on', x === b));
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
$('btnStart').onclick = () => {
  $('modal').classList.add('hide');
  updateTutorial();
};
$('btnNew').onclick = () => {
  if (confirm('Neues Spiel starten? Fortschritt geht verloren.')) newGame();
};

/* Speichern / Laden */
export function save(silent) {
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        v: 7,
        money: S.money,
        energy: S.energy,
        blood: S.blood,
        ash: S.ash,
        t: S.t,
        gore: S.gore,
        kills: S.kills,
        sold: S.sold,
        escaped: S.escaped,
        done: S.done,
        tutStep: S.tutStep,
        blds: blds.map((b) => ({
          t: b.t,
          col: b.col,
          dirt: b.dirt,
          on: b.on,
          buf: b.buf,
          items: b.items.map((i) => ({ rot: i.rot, kind: i.kind, part: i.part })),
        })),
      }),
    );
    if (!silent) toast('Gespeichert', 'good');
  } catch (e) {
    if (!silent) toast('Speichern fehlgeschlagen', 'bad');
  }
}
export const hasSave = () => {
  try {
    const r = JSON.parse(localStorage.getItem(SAVE_KEY));
    return !!r && r.v === 7;
  } catch (e) {
    return false;
  }
};
export function load() {
  let raw = null;
  try {
    raw = JSON.parse(localStorage.getItem(SAVE_KEY));
  } catch (e) {}
  if (!raw || raw.v !== 7) return toast('Kein Spielstand', 'bad');
  const run = S.running;
  if (run) toggleRun();
  initSim();
  Object.assign(S, {
    money: raw.money,
    energy: raw.energy,
    blood: raw.blood,
    ash: raw.ash,
    t: raw.t,
    gore: raw.gore,
    kills: raw.kills,
    sold: raw.sold,
    escaped: raw.escaped,
    done: raw.done,
    tutStep: raw.tutStep,
    tool: null,
    sel: null,
  });
  for (const o of raw.blds || []) {
    if (!DEF[o.t]) continue;
    const b = addBuilding(o.t, o.col, true);
    if (b) {
      b.dirt = o.dirt || 0;
      b.on = o.on !== false;
      b.buf = o.buf || 0;
      b.items = (o.items || []).map((i) => ({ rot: i.rot || 0, kind: i.kind, part: i.part }));
    }
  }
  document
    .querySelectorAll('#goreSeg button')
    .forEach((x) => x.classList.toggle('on', +x.dataset.g === S.gore));
  renderTabs();
  renderList();
  renderInspector();
  renderHUD();
  updateTutorial();
  toast('Spielstand geladen', 'good');
}
$('btnSave').onclick = () => save();
$('btnLoad').onclick = load;
$('btnContinue').onclick = () => {
  load();
  $('modal').classList.add('hide');
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

export function setupWorld() {
  for (let c = 3; c <= 12; c++) addBuilding('belt', c, true);
  addBuilding('spawn', 3, true);
}
export function newGame() {
  const g = S ? S.gore : 100;
  setState(freshState());
  S.gore = g;
  initSim();
  setupWorld();
  $('btnPlay').textContent = '▶ Start';
  renderTabs();
  renderList();
  renderInspector();
  renderHUD();
  updateTutorial();
}
