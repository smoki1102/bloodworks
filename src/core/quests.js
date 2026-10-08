import { QUESTS } from '../config/quest-defs.js';
import { S } from './state.js';
import { upgCount } from './upgrades.js';

export const METRIC = {
  kills: () => S.stats.kills,
  caught: () => S.stats.caught,
  sold: () => S.stats.sold,
  ejected: () => S.stats.ejected,
  toggled: () => S.stats.toggled,
  schleuder: () => S.stats.schleuder,
  partsSold: () => S.stats.partsSold,
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
