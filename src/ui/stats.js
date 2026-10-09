import { S, blds, corpses, parts, sticks } from '../core/state.js';
import { bloodCapTotal, bloodTotal } from '../core/pipes.js';
import { partPoints } from '../core/parts.js';
import { ratePerMin, rateWindow } from '../core/rates.js';
import { $, fmt } from '../utils/helpers.js';

/**
 * Statistik-Dashboard: Summen und laufende Raten (pro Minute) aus `core/rates.js`.
 * Reines Lesen – die Simulation bleibt die Wahrheit.
 */

let last = null;

export const statsOpen = () => {
  const el = $('statsPanel');
  return !!el && !el.classList.contains('hide');
};

export function openStats() {
  const el = $('statsPanel');
  if (el) el.classList.remove('hide');
  renderStats();
}

export function closeStats() {
  const el = $('statsPanel');
  if (el) el.classList.add('hide');
}

const clock = (s) => {
  const m = Math.floor(s / 60),
    sec = Math.floor(s % 60);
  return m + ':' + String(sec).padStart(2, '0');
};

export function renderStats() {
  const el = $('statPane');
  if (!el || !statsOpen()) return;
  const timeEl = $('stTime');
  if (timeEl) timeEl.textContent = clock(S.t);
  const win = rateWindow();
  const per = (k) => fmt(Math.round(ratePerMin(k))) + '/min';
  const row = (label, val) => `<div class="row"><span>${label}</span><span>${val}</span></div>`;
  const card = (title, rows) =>
    `<div class="statCard"><h3>${title}</h3>${rows.join('')}</div>`;

  const belts = blds.filter((b) => b.t === 'belt').length;
  const pipes = blds.filter((b) => b.t === 'pipe' || b.t === 'tank' || b.t === 'drain').length;
  const note = win >= 2 ? `Fenster ${Math.round(win)} s` : 'sammelt noch …';

  const html =
    card('DURCHSATZ · pro Minute', [
      row('erledigt', per('kills')),
      row('Teile verkauft', per('partsSold')),
      row('Blut verkauft', per('sold')),
      row('gefangen', per('caught')),
      row('abgeworfen', per('ejected')),
      row('entkommen', per('escaped')),
    ]) +
    card('GESAMT', [
      row('erledigt', fmt(S.stats.kills)),
      row('Teile verkauft', fmt(S.stats.partsSold)),
      row('Blut verkauft', fmt(S.stats.sold)),
      row('abgeworfen', fmt(S.stats.ejected)),
      row('gefangen', fmt(S.stats.caught)),
      row('entkommen', fmt(S.stats.escaped)),
    ]) +
    card('WIRTSCHAFT', [
      row('Geld', fmt(S.money) + ' €'),
      row('Blut', fmt(bloodTotal()) + ' / ' + fmt(bloodCapTotal())),
      row('Körperteile', fmt(partPoints())),
      row('Asche', fmt(S.ash)),
      row('Energie', fmt(Math.round(S.energy)) + ' / ' + fmt(S.energyMax)),
    ]) +
    card('WELT', [
      row('Gebäude', fmt(blds.length)),
      row('Förderbänder', fmt(belts)),
      row('Rohre', fmt(pipes)),
      row('Sticks unterwegs', fmt(sticks.length)),
      row('Leichen', fmt(corpses.length)),
      row('Partikel', fmt(parts.length)),
    ]) +
    card('ZEIT', [row('Spielzeit', clock(S.t)), row('Fenster', note), row('Tempo', S.speed + '×')]);

  if (html !== last) {
    last = html;
    el.innerHTML = html;
  }
}
