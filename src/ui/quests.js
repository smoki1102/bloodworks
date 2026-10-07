import { toast } from '../core/effects.js';
import { questDef, questProgress, questStep, questTotal } from '../core/quests.js';
import { S } from '../core/state.js';
import { $ } from '../utils/helpers.js';

let lastQ = null;

/** Prüft den Auftragsfortschritt und rendert die Anzeige (0,4-s-Takt). */
export function updateQuest() {
  const done = questStep();
  if (done) toast('Auftrag erfüllt: ' + done.n + ' · +' + done.reward + ' €', 'good');
  const el = $('quest');
  if (!el) return;
  const q = questDef();
  const html = q
    ? `<div class="qHead">AUFTRAG ${S.quest + 1} / ${questTotal()} · +${q.reward} €</div>
       <div class="qName">${q.n}</div>
       <div class="qDesc">${q.d}</div>
       <div class="bar"><i style="width:${(questProgress() / q.goal) * 100}%"></i></div>
       <div class="qProg">${questProgress()} / ${q.goal}</div>`
    : `<div class="qHead">AUFTRÄGE</div><div class="qName">Alle Aufträge erledigt</div>`;
  if (html !== lastQ) {
    lastQ = html;
    el.innerHTML = html;
  }
}
