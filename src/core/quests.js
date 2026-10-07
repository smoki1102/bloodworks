import { QUESTS } from '../config/quest-defs.js';
import { S, blds } from './state.js';
import { upgCount } from './upgrades.js';

const METRIC = {
  kills: () => S.kills,
  caught: () => S.caught,
  sold: () => S.sold,
  ejected: () => S.ejected,
  toggled: () => S.toggled,
  schleuder: () => blds.filter((b) => b.t === 'schleuder').length,
  upg: () => upgCount(),
};

export const questDef = () => QUESTS[S.quest] || null;
export const questTotal = () => QUESTS.length;

export function questProgress() {
  const q = questDef();
  if (!q) return 0;
  return Math.min(METRIC[q.metric](), q.goal);
}

/** Schreitet die Kette weiter, wenn das Ziel erreicht ist. Lohnt oder null. */
export function questStep() {
  const q = questDef();
  if (!q || METRIC[q.metric]() < q.goal) return null;
  S.quest++;
  S.money += q.reward;
  return q;
}
