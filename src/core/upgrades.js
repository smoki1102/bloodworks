import { UPG } from '../config/upgrade-defs.js';
import { toast } from './effects.js';
import { S } from './state.js';

export const upgDef = (id) => UPG.find((u) => u.id === id) || null;
export const upgLevel = (id) => S.up.lv[id] || 0;
export const upgCount = () => Object.values(S.up.lv).reduce((a, b) => a + b, 0);
export const upgCost = (u) => (upgLevel(u.id) >= u.max ? null : u.costs[upgLevel(u.id)]);

const EFFECT = {
  speed: (lv, u) => 1 + lv * u.step,
  price: (lv, u) => 1 + lv * u.step,
  spawn: (lv, u) => 1 - lv * u.step,
  tank: (lv, u) => lv * u.step,
};

export function upgEff(key) {
  const u = UPG.find((x) => x.key === key);
  if (!u) return key === 'tank' ? 0 : 1;
  return EFFECT[key](upgLevel(u.id), u);
}

export function buyUpgrade(id) {
  const u = upgDef(id);
  if (!u) return;
  const lv = upgLevel(id);
  if (lv >= u.max) return toast(u.n + ' ist bereits maximal erforscht', 'bad');
  const cost = u.costs[lv];
  if (S.blood < cost) return toast('Nicht genug Blut (' + cost + ' nötig)', 'bad');
  S.blood -= cost;
  S.up.lv[id] = lv + 1;
  toast(u.n + ' Stufe ' + (lv + 1) + ' erforscht', 'good');
}
