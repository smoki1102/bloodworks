import { QUESTS } from '../config/quest-defs.js';
import { toast } from '../core/effects.js';
import { questDef, questProgress, questStep, questTotal } from '../core/quests.js';
import { S } from '../core/state.js';
import { $ } from '../utils/helpers.js';

let lastQ = null;

const STATE_MARK = { done: '✓', now: '▸', todo: '·' };

function stateOf(i) {
  if (i < S.quest) return 'done';
  if (i === S.quest) return 'now';
  return 'todo';
}

function logHtml() {
  return QUESTS.map((q, i) => {
    const st = stateOf(i);
    const prog =
      st === 'done'
        ? ''
        : st === 'now'
          ? `<span class="qMiniProg">${questProgress()} / ${q.goal}</span>`
          : '';
    return `<div class="qLogRow ${st}"><span class="qMark">${STATE_MARK[st]}</span><span class="qLogName">${q.n}</span>${prog}</div>`;
  }).join('');
}

/** Prüft den Auftragsfortschritt und rendert Karte + Log (0,4-s-Takt). */
export function updateQuest() {
  const done = questStep();
  if (done) toast('Auftrag erfüllt: ' + done.n + ' · +' + done.reward + ' €', 'good');
  const el = $('quest');
  if (!el) return;
  const q = questDef();
  const head = q
    ? `<div class="qHead">AUFTRAG ${S.quest + 1} / ${questTotal()} · +${q.reward} €</div>
       <div class="qName">${q.n}</div>
       <div class="qDesc">${q.d}</div>
       <div class="bar"><i style="width:${(questProgress() / q.goal) * 100}%"></i></div>
       <div class="qProg">${questProgress()} / ${q.goal}</div>`
    : `<div class="qHead">AUFTRÄGE · ${questTotal()} / ${questTotal()}</div>
       <div class="qName">Alle Aufträge erledigt</div>`;
  const html = head + `<div class="qLog">${logHtml()}</div>`;
  if (html !== lastQ) {
    lastQ = html;
    el.innerHTML = html;
  }
}
