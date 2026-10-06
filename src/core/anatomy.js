import {
  BELT_Y,
  BLEED,
  CORPSE_LIFE,
  MAX_HP,
} from '../config/constants.js';
import { bloodColor, burst, nBurst } from './effects.js';
import { S, corpses } from './state.js';
import { rnd } from '../utils/helpers.js';

/** Reihenfolge der Körperteile, wie sie gezeichnet und abgetrennt werden. */
export const PARTS = ['head', 'torso', 'armL', 'armR', 'legL', 'legR'];
export const TORSO_PARTS = ['armL', 'armR', 'legL', 'legR'];

/** Wie viele Gliedmaßen je Gore-Level abgetrennt werden dürfen. */
export const maxLimbs = () => (S.gore === 0 ? 0 : S.gore === 50 ? 2 : 6);

export function makeBody() {
  return {
    hp: MAX_HP,
    bleeding: 0,
    lost: 0,
    hits: 0,
    hitAt: {},
    limbs: { head: 1, torso: 1, armL: 1, armR: 1, legL: 1, legR: 1 },
  };
}

export const missingOf = (body) => PARTS.filter((p) => body && !body.limbs[p]);
export const aliveLimbs = (body) => PARTS.filter((p) => p !== 'torso' && body.limbs[p]);

/**
 * Reißt eine Gliedmaße ab und lässt sie als eigenes Stück zu Boden fallen.
 * Liefert false, wenn nichts mehr abgetrennt werden konnte.
 */
export function severLimb(s, part) {
  const body = s.body;
  if (!body || !body.limbs[part]) return false;
  if (body.lost >= maxLimbs()) return false;
  body.limbs[part] = 0;
  body.lost++;
  body.bleeding += BLEED[part];
  const x = s.x,
    y = s.y - 20;
  corpses.push({
    x,
    y,
    vx: (rnd() - 0.5) * 110,
    vy: -120 - rnd() * 70,
    rot: rnd() * 6,
    state: 'fall',
    kind: 'limb',
    part,
    bleed: 2.6,
    life: CORPSE_LIFE,
    missing: [],
  });
  burst(x, y, bloodColor(), nBurst(6), 160);
  return true;
}

/** Direkter Treffer ohne Gliedmaßenverlust (Gore 0 oder erschöpftes Opfer). */
export function wound(s, amount) {
  if (!s.body) return true;
  s.body.hp -= amount;
  return s.body.hp <= 0;
}

/**
 * Blutverlust pro Tick.
 * @returns {boolean} true, wenn der Stick an der Wunde gestorben ist
 */
export function bleedOut(s, dt) {
  const b = s.body;
  if (!b || b.bleeding <= 0) return false;
  b.hp -= b.bleeding * dt;
  return b.hp <= 0;
}

/** Zerlegt einen toten Stick in Leichen-Teile (fehlende Gliedmaßen übernimmt der Renderer). */
export function bodyToCorpse(s) {
  return {
    x: s.x,
    y: BELT_Y,
    vx: 0,
    vy: 0,
    rot: 0,
    state: 'belt',
    kind: 'corpse',
    missing: missingOf(s.body),
    bleed: 0.6,
    life: CORPSE_LIFE,
  };
}
