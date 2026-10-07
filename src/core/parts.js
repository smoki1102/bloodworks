import { PART_VALUE } from '../config/constants.js';
import { S } from './state.js';

/** Körperteil-Worrat: wird beim Abtrennen sofort und einmalig gezählt. */
export function collectPart(part) {
  if (!part || !(part in S.parts)) return;
  S.parts[part]++;
}

export const partCount = () => Object.values(S.parts).reduce((a, b) => a + b, 0);

export const partPoints = () =>
  Object.entries(S.parts).reduce((a, [k, v]) => a + (PART_VALUE[k] || 0) * v, 0);

/** Verbraucht Wertpunkte – teure Teile (Kopf) bleiben möglichst erhalten. */
export function spendParts(n) {
  if (n <= 0) return true;
  if (partPoints() < n) return false;
  const order = Object.keys(PART_VALUE).sort((a, b) => PART_VALUE[a] - PART_VALUE[b]);
  const take = {};
  let rest = n;
  for (const k of order) {
    while (rest > 0 && S.parts[k] > (take[k] || 0)) {
      take[k] = (take[k] || 0) + 1;
      rest -= PART_VALUE[k];
    }
    if (rest <= 0) break;
  }
  if (rest > 0) {
    // Kein passender Wechsel mehr – ein weiteres Teil deckt den Rest.
    for (const k of order) {
      if (S.parts[k] > (take[k] || 0)) {
        take[k] = (take[k] || 0) + 1;
        rest = 0;
        break;
      }
    }
  }
  if (rest > 0) return false;
  for (const [k, v] of Object.entries(take)) S.parts[k] -= v;
  return true;
}

export function giveParts(stock) {
  for (const [k, v] of Object.entries(stock || {})) if (k in S.parts) S.parts[k] += v;
}
