import { BRANCHES, SKILL, TUTORIAL_GIFT } from '../config/skill-defs.js';
import { toast } from './effects.js';
import { giveParts, spendParts } from './parts.js';
import { spendBlood } from './pipes.js';
import { S, defaultFx } from './state.js';

export { BRANCHES };

export const skillDef = (id) => SKILL.find((n) => n.id === id) || null;
export const skillLv = (id) => S.skill.lv[id] || 0;
export const skillMaxed = (n) => skillLv(n.id) >= n.max;
export const skillCost = (n) => (skillMaxed(n) ? null : n.costs[skillLv(n.id)]);
export const skillReady = (n) => n.req.every(([id, lv]) => skillLv(id) >= lv);

export const branchOf = (br) => SKILL.filter((n) => n.br === br);
export const spentIn = (br) =>
  SKILL.filter((n) => n.br === br).reduce((a, n) => {
    const lv = skillLv(n.id);
    return a + n.costs.slice(0, lv).reduce((x, y) => x + y, 0);
  }, 0);

/** Alle gekauften Effekte neu aus den Knoten berechnen – keine Zyklen. */
export function recomputeFx() {
  const fx = defaultFx();
  for (const n of SKILL) {
    const lv = skillLv(n.id);
    if (!lv) continue;
    for (const op of n.fx || []) {
      if (op.mul) fx[op.k] *= Math.pow(op.mul, lv);
      else if (op.add) fx[op.k] += op.add * lv;
    }
  }
  S.fx = fx;
  S.netDirty = true;
}

export function buySkill(id) {
  const n = skillDef(id);
  if (!n) return;
  const lv = skillLv(id);
  if (lv >= n.max) return toast(n.n + ' ist bereits maximal gelernt', 'bad');
  if (!skillReady(n)) return toast('Voraussetzung fehlt: ' + reqText(n), 'bad');
  const cost = n.costs[lv];
  if (n.cur === 'blood') {
    if (!spendBlood(cost)) return toast('Nicht genug Blut (' + cost + ' nötig)', 'bad');
  } else if (!spendParts(cost)) {
    return toast('Nicht genug Körperteile (' + cost + ' Wert nötig)', 'bad');
  }
  S.skill.lv[id] = lv + 1;
  recomputeFx();
  toast(n.n + ' Stufe ' + (lv + 1) + ' gelernt', 'good');
  return true;
}

function reqText(n) {
  return n.req
    .map(([id, lv]) => {
      const d = skillDef(id);
      return (d ? d.n : id) + ' ' + lv;
    })
    .join(', ');
}

/** Startguthaben nach dem Tutorial. */
export function giveSkillGift() {
  if (S.gift) return;
  S.gift = true;
  S.blood += TUTORIAL_GIFT.blood;
  giveParts(TUTORIAL_GIFT.parts);
  toast('Skill-Startguthaben: ' + TUTORIAL_GIFT.blood + ' Blut + Körperteile', 'good');
}
