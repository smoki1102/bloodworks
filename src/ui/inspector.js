import { DEF } from '../config/building-defs.js';
import { BIN_ROT_TIME, TARGETS } from '../config/constants.js';
import { toast } from '../core/effects.js';
import { hitChance } from '../core/machines.js';
import { netOf, suctionNetOf } from '../core/pipes.js';
import { sellBuilding } from '../core/placement.js';
import { S, blds } from '../core/state.js';
import { sellable, setReserve } from '../core/market.js';
import { $, clamp, fmt } from '../utils/helpers.js';
import { iconSvg } from '../render/icons.js';

export let lastInsp = null;

const LINK_TXT = {
  ok: '<b class="good">Angeschlossen</b>',
  none: '<b class="err">Kein Anschluss</b>',
  '-': '<b>—</b>',
};
const CUT_KINDS = ['spike', 'press', 'blade'];

function queueLabel(b) {
  if (b.t === 'bin') return 'Bestand';
  if (b.t === 'oven' || b.t === 'acid') return 'Eingang';
  return 'Queue';
}
function queueMax(b) {
  const cap = DEF[b.t].cap;
  return cap ? ' / ' + cap : '';
}
function linkLabel(b) {
  let html = '';
  const k = DEF[b.t].kind;
  if (!['pipe', 'tank', 'drain', 'market', 'gen'].includes(k)) {
    const sn = suctionNetOf(b);
    if (sn >= 0)
      html += `<div class="kv"><span>Absaugung</span><b class="good">Verbunden · Netz #${sn}</b></div>`;
  }
  if (b.link === 'ok' || b.link === 'none') {
    const n = netOf(b);
    const net =
      n && n.id >= 0
        ? `<div class="kv"><span>Netz</span><b>#${n.id} · ${fmt(n.v)} / ${fmt(n.cap)}</b></div>`
        : '';
    html += `<div class="kv"><span>Verbindung</span>${LINK_TXT[b.link]}</div>${net}`;
  }
  return html;
}
function progressBar(b) {
  if (b.t === 'tank') {
    const n = netOf(b);
    const v = n ? n.v : S.blood;
    const cap = n ? n.cap : S.bloodCap;
    const p = clamp((v / Math.max(1, cap)) * 100, 0, 100);
    return `<div class="kv"><span>Füllstand</span><b>${fmt(v)} / ${fmt(cap)}</b></div>
      <div class="bar"><i class="fill-blood" style="width:${p}%"></i></div>`;
  }
  if (b.t === 'bin' && b.items.length) {
    const avgRot =
      b.items.reduce((a, i) => a + (i.rot || 0), 0) / b.items.length;
    const p = clamp((avgRot / BIN_ROT_TIME) * 100, 0, 100);
    return `<div class="bar"><i class="fill-dim" style="width:${Math.floor(p)}%"></i></div>`;
  }
  if ((b.t === 'oven' || b.t === 'acid') && b.items.length) {
    const t = b.t === 'oven' ? 1.4 : 1.7;
    const p = clamp((b.prog / t) * 100, 0, 100);
    return `<div class="bar"><i class="${b.t === 'oven' ? 'fill-warn' : 'fill-ok'}" style="width:${Math.floor(p)}%"></i></div>`;
  }
  if (b.t === 'press') {
    return `<div class="kv"><span>Zyklus</span><b>${Math.floor(((b.phase % 1.4) / 1.4) * 100)}%</b></div>`;
  }
  return '';
}
function utilBar(b) {
  const d = DEF[b.t];
  if (d.kind === 'belt' || (d.e === 0 && b.t !== 'bin' && b.t !== 'oven' && b.t !== 'acid'))
    return '';
  const p = clamp((b.util || 0) * 100, 0, 100);
  return `<div class="kv"><span>Auslastung</span><b>${Math.floor(p)}%</b></div>
    <div class="bar"><i class="${p > 90 ? 'fill-err' : 'fill-dim'}" style="width:${p}%"></i></div>`;
}
function rateLabel(b) {
  if (!b.rate) return '';
  if (b.t === 'bin' || b.t === 'oven' || b.t === 'acid')
    return `<div class="kv"><span>Durchsatz</span><b>${b.rate.toFixed(2)} Teile/s</b></div>`;
  if (b.t === 'market' || b.t === 'gen' || b.t === 'drain')
    return `<div class="kv"><span>Durchsatz</span><b>${b.rate.toFixed(1)}/s</b></div>`;
  return '';
}

function targetCtl(b) {
  if (!CUT_KINDS.includes(b.t)) return '';
  const opts = TARGETS.map(
    ([v, l]) => `<option value="${v}"${(b.target || '') === v ? ' selected' : ''}>${l}</option>`,
  ).join('');
  return `<div class="kv"><span>Zielkörperteil</span>
    <select data-f="target">${opts}</select></div>
    <div class="kv"><span>Trefferquote</span><b>${Math.round(hitChance() * 100)} %</b></div>`;
}
function filterCtl(b) {
  if (b.t !== 'filter') return '';
  const by = b.filter?.by || 'part';
  const val = b.filter?.val || 'head';
  const parts = [
    ['body', 'Ganze Leiche'],
    ['head', 'Kopf'],
    ['torso', 'Torso'],
    ['armL', 'Arm links'],
    ['armR', 'Arm rechts'],
    ['legL', 'Bein links'],
    ['legR', 'Bein rechts'],
  ];
  const states = [
    ['healthy', 'Unverletzt'],
    ['hurt', 'Verletzt'],
    ['dead', 'Tot'],
  ];
  const vals = (by === 'state' ? states : parts)
    .map(([v, l]) => `<option value="${v}"${val === v ? ' selected' : ''}>${l}</option>`)
    .join('');
  return `<div class="kv"><span>Sortiert nach</span>
      <select data-f="filterBy">
        <option value="part"${by === 'part' ? ' selected' : ''}>Körperteil</option>
        <option value="state"${by === 'state' ? ' selected' : ''}>Zustand</option>
      </select></div>
    <div class="kv"><span>Regel</span><select data-f="filterVal">${vals}</select></div>
    <div class="kv"><span>Ausgang A</span><b>Regel erfüllt</b></div>
    <div class="kv"><span>Ausgang B</span><b>Rest</b></div>`;
}
function reserveCtl(b) {
  if (b.t !== 'market') return '';
  const r = b.reserve || { v: 40, unit: 'abs' };
  return `<div class="kv"><span>Blutreserve</span><b>${r.v}${r.unit === 'pct' ? ' %' : ''}</b></div>
    <div class="kv"><span>Frei verkäuflich</span><b>${fmt(sellable(b))} Blut</b></div>
    <div class="kv res-row">
      <input data-f="resV" type="number" min="0" value="${r.v}" />
      <select data-f="resU">
        <option value="abs"${r.unit === 'abs' ? ' selected' : ''}>Blut</option>
        <option value="pct"${r.unit === 'pct' ? ' selected' : ''}>%</option>
      </select>
      <button data-a="resSet">Setzen</button>
    </div>`;
}

export function renderInspector() {
  const p = $('inspector'),
    b = S.sel;
  if (!b || !blds.includes(b)) {
    if (p.style.display !== 'none') {
      p.style.display = 'none';
      p.innerHTML = '';
      lastInsp = null;
    }
    return;
  }
  p.style.display = 'block';
  const d = DEF[b.t],
    clean = clamp(100 - b.dirt, 0, 100);
  const cost = Math.round((15 + b.dirt * 0.8) * (S.fx?.cleanCost ?? 1));
  let st = 'Aktiv',
    cls = '';
  if (b.clean > 0) {
    st = 'Reinigung läuft';
    cls = 'warn';
  } else if (b.on === false) {
    st = 'Aus';
    cls = 'err';
  } else if (d.e > 0 && S.pf < 0.4) {
    st = 'Kein Strom';
    cls = 'err';
  } else if (b.link === 'none') {
    st = 'Braucht Anschluss';
    cls = 'warn';
  } else if (b.dirt >= 70) {
    st = 'Verschmutzt';
    cls = 'warn';
  }
  const onBtn =
    d.kind === 'belt' || b.t === 'spawn'
      ? ''
      : `<button data-a="toggle" style="grid-column:1">${iconSvg('power')} ${b.on ? 'An' : 'Aus'}</button>`;
  const html = `<h3>${iconSvg(d.icon)} ${d.n}<button class="close" data-a="close" data-tip="Schließen (Esc)" aria-label="Schließen">${iconSvg('close')}</button></h3>
    <div class="panel">
    <div class="kv"><span>Status</span><b class="${cls}">${st}</b></div>
    ${utilBar(b)}${progressBar(b)}${linkLabel(b)}${rateLabel(b)}
    ${b.items.length ? `<div class="kv"><span>${queueLabel(b)}</span><b>${b.items.length}${queueMax(b)}</b></div>` : ''}
    ${targetCtl(b)}${filterCtl(b)}${reserveCtl(b)}
    <div class="kv"><span>Sauberkeit</span><b>${clean.toFixed(0)}%</b></div>
    <div class="bar"><i class="${clean > 60 ? 'fill-dim' : clean > 30 ? 'fill-warn' : 'fill-err'}" style="width:${clean}%"></i></div>
    <div class="kv"><span>Verbrauch</span><b>${d.e ? d.e.toFixed(2) + ' E/s' : '—'}</b></div>
    <div class="acts">${onBtn}<button data-a="clean" ${b.dirt < 3 || b.clean > 0 ? 'disabled' : ''}>${iconSvg('clean')} Reinigen · ${cost} €</button>
    <button class="danger" data-a="sell">Verkaufen · +${Math.round((d.cost || 0) * 0.5)} €</button></div></div>`;
  if (html !== lastInsp) {
    // Eingaben (Select/Number) nicht zerstören, solange sie fokussiert sind –
    // sonst schließt sich die Zielauswahl sofort wieder.
    const ae = document.activeElement;
    if (ae && p.contains(ae) && ['INPUT', 'SELECT', 'TEXTAREA'].includes(ae.tagName)) return;
    lastInsp = html;
    p.innerHTML = html;
  }
}

export function sellSelected(b) {
  if (!b) return;
  sellBuilding(b);
  S.sel = null;
  renderInspector();
}
export function toggleSelected() {
  const b = S.sel;
  if (!b) return;
  b.on = !b.on;
  S.toggled++;
  renderInspector();
}
export function cleanSelected(b) {
  const cost = Math.round((15 + b.dirt * 0.8) * (S.fx?.cleanCost ?? 1));
  if (S.money < cost) return toast('Nicht genug Geld', 'bad');
  S.money -= cost;
  b.clean = 2;
  renderInspector();
}

/** Select/Inputs im Inspektor – wird von ui.js bei `change`/`click` aufgerufen. */
export function inspectorField(name, value) {
  const b = S.sel;
  if (!b) return;
  if (name === 'target') b.target = value;
  else if (name === 'filterBy') {
    b.filter = { by: value, val: value === 'state' ? 'healthy' : 'head' };
  } else if (name === 'filterVal') {
    b.filter = { ...(b.filter || { by: 'part' }), val: value };
  } else if (name === 'resV' || name === 'resU') {
    const vEl = document.querySelector('[data-f="resV"]');
    const uEl = document.querySelector('[data-f="resU"]');
    const v = Number(vEl ? vEl.value : b.reserve ? b.reserve.v : 40);
    const u = uEl ? uEl.value : 'abs';
    setReserve(b, Math.max(0, Math.floor(Number.isFinite(v) ? v : 0)), u);
  }
  lastInsp = null;
  renderInspector();
}
export function inspectorAction(a) {
  const b = S.sel;
  if (a === 'close') {
    S.sel = null;
    renderInspector();
  } else if (a === 'sell') {
    sellSelected(b);
  } else if (a === 'clean' && b) {
    cleanSelected(b);
  } else if (a === 'toggle') {
    toggleSelected();
  } else if (a === 'resSet' && b) {
    inspectorField('resV', null);
    toast('Reserve gesetzt', 'good');
  }
}
