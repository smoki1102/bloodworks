import { BLEED, CORPSE_LIFE, MAX_HP, PART_HP } from '../config/constants.js';
import { bloodColor, burst, nBurst } from './effects.js';
import { S } from './state.js';
import { rnd } from '../utils/helpers.js';
import { collectPart } from './parts.js';

/** Reihenfolge der Körperteile, wie sie gezeichnet und abgetrennt werden. */
export const PARTS = ['head', 'torso', 'armL', 'armR', 'legL', 'legR'];

/** Wie viele Gliedmaßen je Gore-Level abgetrennt werden dürfen. */
export const maxLimbs = () => (S.gore === 0 ? 0 : S.gore === 50 ? 2 : 6);

export function makeBody() {
  const php = {};
  for (const p of PARTS) php[p] = PART_HP[p];
  return {
    hp: MAX_HP,
    bleeding: 0,
    lost: 0,
    hits: 0,
    hitAt: {},
    limbs: { head: 1, torso: 1, armL: 1, armR: 1, legL: 1, legR: 1 },
    php,
  };
}

export const missingOf = (body) => PARTS.filter((p) => body && !body.limbs[p]);
export const aliveLimbs = (body) => PARTS.filter((p) => p !== 'torso' && body.limbs[p]);

export const isDead = (body) =>
  !body || body.hp <= 0 || !body.limbs.head || !body.limbs.torso;

/** Zustand einer Ware für den Filter. */
export function stateOfItem(it) {
  if (it.kind === 'stick') {
    if (isDead(it.body)) return 'dead';
    const b = it.body;
    if (b.bleeding > 0 || b.hp < MAX_HP || b.lost > 0) return 'hurt';
    return 'healthy';
  }
  if (it.kind === 'corpse') return 'dead';
  return 'hurt';
}

/** Filterregel der Weiche/Sortieranlage. */
export function filterMatch(it, f) {
  if (!f) return false;
  if (f.by === 'state') return stateOfItem(it) === f.val;
  if (f.val === 'body') return it.kind === 'corpse';
  if (it.kind === 'limb') return it.part === f.val;
  if (it.kind === 'stick') return !!it.body?.limbs?.[f.val];
  if (it.kind === 'corpse') return (it.missing || []).indexOf(f.val) < 0;
  return false;
}

/**
 * Reißt eine Gliedmaße vom Körper. Gibt das Teil zurück oder null.
 * Sammelt das Körperteil sofort als Währung ein.
 */
export function severPart(body, part) {
  if (!body || !body.limbs[part]) return null;
  if (body.lost >= maxLimbs()) return null;
  body.limbs[part] = 0;
  body.lost++;
  body.bleeding += BLEED[part];
  collectPart(part);
  return part;
}

/** Erzeugt die abgetrennte Gliedmaße als Ware – im Band oder fallend. */
export function limbItem(part) {
  return {
    kind: 'limb',
    part,
    p: 0,
    lat: 0,
    rot: rnd() * 6,
    bleed: 2.6,
    life: CORPSE_LIFE,
  };
}

export function limbFalling(part, x, y) {
  return {
    kind: 'limb',
    part,
    x,
    y,
    vx: (rnd() - 0.5) * 110,
    vy: -90 - rnd() * 60,
    rot: rnd() * 6,
    spin: (rnd() - 0.5) * 5,
    state: 'fall',
    bleed: 2.6,
    life: CORPSE_LIFE,
    missing: [],
  };
}

/** Direkter Treffer ohne Gliedmaßenverlust. */
export function wound(body, amount) {
  if (!body) return true;
  body.hp -= amount;
  return body.hp <= 0;
}

/**
 * Blutverlust pro Tick.
 * @returns {boolean} true, wenn der Stick an der Wunde gestorben ist
 */
export function bleedOut(body, dt) {
  if (!body || body.bleeding <= 0) return false;
  body.hp -= body.bleeding * dt;
  return body.hp <= 0;
}

/** Zerlegt einen toten Stick in eine Leichen-Ware. */
export function bodyToCorpseItem(body, chair) {
  return {
    kind: 'corpse',
    p: 0,
    lat: 0,
    rot: 0,
    missing: missingOf(body),
    bleed: 0.6,
    life: CORPSE_LIFE,
    chair: !!chair,
  };
}

/** Zerlegt einen fallenden Stick in eine Leiche am Boden. */
export function bodyToFloorCorpse(s) {
  return {
    kind: 'corpse',
    x: s.x,
    y: s.y,
    vx: 0,
    vy: 0,
    rot: 0,
    state: 'floor',
    missing: missingOf(s.body),
    bleed: 0.6,
    life: 90,
  };
}

export function corpseBlood(x, y) {
  burst(x, y, bloodColor(), nBurst(6), 160);
}
