import { DEF } from '../config/building-defs.js';
import { S } from '../core/state.js';
import { sellBuilding } from '../core/placement.js';
import { toast } from '../core/effects.js';
import { $, clamp, fmt } from '../utils/helpers.js';
import { blds } from '../core/state.js';

export let lastInsp = null;
const LINK_TXT = {
  ok: '<b class="good">Angeschlossen</b>',
  none: '<b class="err">Kein Anschluss</b>',
};

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
  if (b.link === 'ok' || b.link === 'none')
    return `<div class="kv"><span>Verbindung</span>${LINK_TXT[b.link]}</div>`;
  return '';
}
function progressBar(b) {
  if (b.t === 'tank') {
    const p = clamp((S.blood / Math.max(1, S.bloodCap)) * 100, 0, 100);
    return `<div class="kv"><span>Füllstand</span><b>${fmt(S.blood)} / ${fmt(S.bloodCap)}</b></div>
      <div class="bar"><i style="width:${p}%;background:#5aa0c8"></i></div>`;
  }
  if (b.t === 'bin' && b.items.length) {
    const p = b.items[0].rot / 9;
    return `<div class="bar"><i style="width:${Math.floor(p * 100)}%;background:#8f8f8f"></i></div>`;
  }
  if ((b.t === 'oven' || b.t === 'acid') && b.items.length) {
    const t = b.t === 'oven' ? 1.4 : 1.7;
    const p = clamp((b.prog / t) * 100, 0, 100);
    return `<div class="bar"><i style="width:${Math.floor(p)}%;background:${b.t === 'oven' ? '#d98e3a' : '#9b9'}"></i></div>`;
  }
  if (b.t === 'press') {
    return `<div class="kv"><span>Zyklus</span><b>${Math.floor(((b.phase % 1.4) / 1.4) * 100)}%</b></div>`;
  }
  return '';
}
function utilBar(b) {
  if (b.t === 'belt' || (DEF[b.t].e === 0 && b.t !== 'bin' && b.t !== 'oven' && b.t !== 'acid')) return '';
  const p = clamp((b.util || 0) * 100, 0, 100);
  return `<div class="kv"><span>Auslastung</span><b>${Math.floor(p)}%</b></div>
    <div class="bar"><i style="width:${p}%;background:${p > 90 ? '#e5483a' : '#8f8f8f'}"></i></div>`;
}
function rateLabel(b) {
  if (b.t === 'bin' || b.t === 'oven' || b.t === 'acid') {
    if (!b.rate) return '';
    return `<div class="kv"><span>Durchsatz</span><b>${b.rate.toFixed(2)} Teile/s</b></div>`;
  }
  if (b.t === 'market' || b.t === 'gen' || b.t === 'drain') {
    if (!b.rate) return '';
    return `<div class="kv"><span>Durchsatz</span><b>${b.rate.toFixed(1)}/s</b></div>`;
  }
  return '';
}

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
    d.band === 'belt' || b.t === 'spawn'
      ? ''
      : `<button data-a="toggle" style="grid-column:1">${b.on ? '⏻ An' : '⏻ Aus'}</button>`;
  const html = `<h3>${d.g} ${d.n}<button class="close" data-a="close" title="Schließen">✕</button></h3><div class="panel">
    <div class="kv"><span>Status</span><b class="${cls}">${st}</b></div>
    ${utilBar(b)}${progressBar(b)}${linkLabel(b)}${rateLabel(b)}
    ${b.items.length ? `<div class="kv"><span>${queueLabel(b)}</span><b>${b.items.length}${queueMax(b)}</b></div>` : ''}
    <div class="kv"><span>Sauberkeit</span><b>${clean.toFixed(0)}%</b></div>
    <div class="bar"><i style="width:${clean}%;background:${clean > 60 ? '#8f8f8f' : clean > 30 ? '#e0a040' : '#e5483a'}"></i></div>
    <div class="kv"><span>Verbrauch</span><b>${d.e ? d.e.toFixed(2) + ' E/s' : '—'}</b></div>
    <div class="acts">${onBtn}<button data-a="clean" ${b.dirt < 3 || b.clean > 0 ? 'disabled' : ''}>✦ Reinigen · ${cost} €</button>
    <button class="danger" data-a="sell">Verkaufen · +${Math.round(d.cost * 0.5)} €</button></div></div>`;
  if (html !== lastInsp) {
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
  const cost = Math.round(15 + b.dirt * 0.8);
  if (S.money < cost) return toast('Nicht genug Geld', 'bad');
  S.money -= cost;
  b.clean = 2;
  renderInspector();
}