import { DEF } from '../config/building-defs.js';
import {
  BASE_CAP,
  BASE_REGEN,
  BELT_SPEED,
  BELT_Y,
  CHAIRS,
  COLS,
  CRUSH_DMG,
  DRIP_TIME,
  CORPSE_CAP,
  CORPSE_FLOOR_LIFE,
  CORPSE_LIFE,
  ENTER_SPEED,
  GEN_BLOOD,
  GEN_GAIN,
  HIT_WINDOW,
  KELLER_FLOOR,
  PW,
  PRESS_PERIOD,
  PRESS_WINDOW,
  RELEASE_TIME,
  SIT_SHUFFLE,
  SPAWN_BASE,
  SPAWN_MIN,
  SPAWN_RAMP,
  SPIKE_HITS,
  STAND_TIME,
  TANK_CAP,
  X0,
} from '../config/constants.js';
import { addBeltBlood, addFloorBlood, bloodColor, burst, nBurst } from './effects.js';
import {
  aliveLimbs,
  bleedOut,
  bodyToCorpse,
  makeBody,
  maxLimbs,
  missingOf,
  severLimb,
} from './anatomy.js';
import { capOf, machine } from './machines.js';
import { bldRect, chairX } from './placement.js';
import { S, beltBlood, blds, corpses, floorBlood, occ, parts, sticks } from './state.js';
import { colAt, colX, rnd } from '../utils/helpers.js';

export { machine };

export function killStick(i) {
  const s = sticks[i];
  corpses.push(s.body ? bodyToCorpse(s) : corpseAt(s.x, 'belt'));
  sticks.splice(i, 1);
  S.kills++;
  addBeltBlood(s.x, 6);
  addFloorBlood(s.x, 2.5);
  burst(s.x, BELT_Y - 16, bloodColor(), nBurst(9), 190);
}

const corpseAt = (x, state) => ({
  x,
  y: state === 'floor' ? KELLER_FLOOR : BELT_Y,
  vx: 0,
  vy: 0,
  rot: 0,
  state,
  kind: 'corpse',
  missing: [],
  bleed: 0.6,
  life: CORPSE_LIFE,
});

/* --------------------------- Warteschlange --------------------------- */
const queueOf = () =>
  sticks.filter((s) => s.state === 'sit' || s.state === 'stand' || s.state === 'enter');

function seatStick(sp) {
  const q = queueOf();
  if (q.length >= CHAIRS) return false;
  const taken = new Set(q.map((s) => s.chair));
  let idx = 0;
  while (taken.has(idx)) idx++;
  sticks.push({
    x: colX(sp.col) + 18,
    y: BELT_Y,
    vy: 0,
    anim: rnd() * 9,
    state: 'enter',
    chair: idx,
    targetX: chairX(sp, idx),
    standT: 0,
    dripT: 0,
    body: makeBody(),
  });
  return true;
}

/** Der vorderste Stick steht auf, alle anderen rücken nach. */
function releaseStick(sp) {
  const q = queueOf();
  if (!q.length) return;
  const front = q.reduce((a, b) => (a.chair > b.chair ? a : b));
  if (front.state === 'enter') return;
  front.state = 'stand';
  front.standT = STAND_TIME;
  q
    .filter((s) => s !== front)
    .sort((a, b) => a.chair - b.chair)
    .forEach((s, i) => {
      s.chair = i;
      s.targetX = chairX(sp, i);
    });
}

/** Verliert der Eingang seine Besitzer, stehen sie auf und laufen weiter. */
function releaseAll() {
  for (const s of sticks)
    if (s.state === 'sit' || s.state === 'enter') {
      s.state = 'walk';
      s.y = BELT_Y;
    }
}

/**
 * Treffer der Spikes-Walze: reißt Gliedmaßen ab, Blutung töet später.
 * @returns {'kill'|'hit'|null}
 */
function spikeHit(b, s) {
  const body = s.body;
  if (!body) return 'kill';
  if (S.gore === 0) return 'kill';
  const last = body.hitAt[b.id] ?? -9;
  if (S.t - last < HIT_WINDOW) return null;
  body.hitAt[b.id] = S.t;
  body.hits++;
  const alive = aliveLimbs(body);
  if (body.hits >= SPIKE_HITS || body.lost >= maxLimbs() || !alive.length) {
    body.hp = 0;
    return 'kill';
  }
  const part = alive[Math.floor(rnd() * alive.length)];
  severLimb(s, part);
  if (part === 'head') return 'kill';
  body.hp -= 25;
  return body.hp <= 0 ? 'kill' : 'hit';
}

export function fluids(dt) {
  for (let c = 0; c < COLS; c++) {
    if (beltBlood[c] > 0.001) {
      const dr = Math.min(beltBlood[c], beltBlood[c] * dt * 0.55 + dt * 0.02);
      beltBlood[c] -= dr;
      floorBlood[c] = Math.min(11, floorBlood[c] + dr);
    }
    beltBlood[c] = Math.max(0, beltBlood[c] - dt * 0.05);
    if (c > 0) {
      const df = beltBlood[c] - beltBlood[c - 1];
      if (Math.abs(df) > 0.4) {
        const mv = df * dt * 1.4;
        beltBlood[c] -= mv;
        beltBlood[c - 1] += mv;
      }
    }
    floorBlood[c] = Math.max(0, floorBlood[c] - dt * 0.03);
  }
}

export function moveSticks(dt) {
  const sp = blds.find((b) => b.t === 'spawn');
  if (!sp) releaseAll();
  else if (sp.clean <= 0) {
    S.spawnTimer -= dt;
    if (S.spawnTimer <= 0) {
      S.spawnTimer = Math.max(SPAWN_MIN, SPAWN_BASE - S.t / SPAWN_RAMP);
      seatStick(sp);
    }
    sp.rel = (sp.rel ?? RELEASE_TIME) - dt;
    if (sp.rel <= 0) {
      sp.rel = RELEASE_TIME;
      if (S.pf > 0.2) releaseStick(sp);
    }
  }
  for (let i = sticks.length - 1; i >= 0; i--) {
    const s = sticks[i];
    s.anim += dt;
    if (s.state === 'enter') {
      const dx = s.targetX - s.x;
      if (Math.abs(dx) < 1.5) {
        s.state = 'sit';
        s.x = s.targetX;
      } else s.x += Math.sign(dx) * ENTER_SPEED * dt;
      continue;
    }
    if (s.state === 'sit') {
      if (sp && s.targetX != null) {
        const dx = s.targetX - s.x;
        if (Math.abs(dx) > 0.5) s.x += Math.sign(dx) * Math.min(SIT_SHUFFLE * dt, Math.abs(dx));
      }
      continue;
    }
    if (s.state === 'stand') {
      s.standT -= dt;
      if (s.standT <= 0) {
        s.state = 'walk';
        s.y = BELT_Y;
      }
      continue;
    }
    if (s.state === 'fall') {
      s.vy += 1500 * dt;
      s.y += s.vy * dt;
      s.x += 12 * dt;
      if (s.y >= KELLER_FLOOR - 2) {
        corpses.push({
          ...corpseAt(s.x, 'floor'),
          missing: missingOf(s.body),
          life: CORPSE_FLOOR_LIFE,
        });
        addFloorBlood(s.x, 9);
        burst(s.x, KELLER_FLOOR - 10, bloodColor(), nBurst(8), 150);
        sticks.splice(i, 1);
      }
      continue;
    }
    if (s.body && bleedOut(s, dt)) {
      addBeltBlood(s.x, 3);
      killStick(i);
      continue;
    }
    if (s.body && s.body.bleeding > 0) {
      s.dripT -= dt;
      if (s.dripT <= 0) {
        s.dripT = DRIP_TIME;
        addBeltBlood(s.x, Math.min(1.2, s.body.bleeding / 12));
      }
    }
    const c = colAt(s.x);
    if (!(c >= 0 && c < COLS && occ.belt[c] > 0)) {
      s.state = 'fall';
      s.vy = 40;
      continue;
    }
    s.y = BELT_Y;
    s.x += BELT_SPEED * dt;
    if (s.x > X0 + PW - 6) {
      sticks.splice(i, 1);
      S.escaped++;
      continue;
    }
    for (const b of blds) {
      const d = DEF[b.t];
      if (!d.kill || b.clean > 0) continue;
      const r = bldRect(b);
      if (s.x < r.x + 6 || s.x > r.x + r.w - 6) continue;
      if (d.kill === 'contact') {
        const res = spikeHit(b, s);
        if (res === 'kill') {
          killStick(i);
          break;
        }
        if (res === 'hit') break;
      } else if (b.phase % PRESS_PERIOD < PRESS_WINDOW) {
        if (s.body) s.body.hp -= CRUSH_DMG;
        killStick(i);
        break;
      }
    }
  }
}

export function catcher(c, needY) {
  for (const b of blds) {
    if (b.t !== 'bin' && b.t !== 'oven' && b.t !== 'acid') continue;
    const r = bldRect(b);
    if (
      c.x > r.x + 4 &&
      c.x < r.x + r.w - 4 &&
      (!needY || c.y >= r.y) &&
      b.items.length < capOf(b.t)
    )
      return b;
  }
  return null;
}
const itemOf = (c) => ({ rot: 0, kind: c.kind || 'corpse', part: c.part });

export function moveCorpses(dt) {
  for (let i = corpses.length - 1; i >= 0; i--) {
    const c = corpses[i];
    c.life -= dt;
    if (c.state === 'belt') {
      const col = colAt(c.x);
      if (!(col >= 0 && col < COLS && occ.belt[col] > 0)) {
        c.state = 'fall';
        c.vy = 30;
      } else {
        c.x += BELT_SPEED * dt;
        c.y = BELT_Y;
        if (c.bleed > 0) {
          c.bleed -= dt;
          if (c.bleed <= 0) {
            c.bleed = c.kind === 'limb' ? 0 : 1.3;
            addBeltBlood(c.x, c.kind === 'limb' ? 0.5 : 1.1);
          }
        }
        if (c.x > X0 + PW - 4) {
          corpses.splice(i, 1);
          continue;
        }
      }
    }
    if (c.state === 'fall') {
      c.vy += 1500 * dt;
      c.y += c.vy * dt;
      c.x += (c.vx ?? 14) * dt;
      if (c.vx) c.vx *= 1 - dt * 1.2;
      c.rot += dt * 2.4;
      const b = catcher(c, true);
      if (b) {
        b.items.push(itemOf(c));
        burst(c.x, c.y, bloodColor(), nBurst(5), 120);
        corpses.splice(i, 1);
        continue;
      }
      if (c.y >= KELLER_FLOOR - 2) {
        c.y = KELLER_FLOOR;
        c.vy = 0;
        c.vx = 0;
        c.state = 'floor';
        c.rot = 0;
        addFloorBlood(c.x, 7);
        burst(c.x, KELLER_FLOOR - 8, bloodColor(), nBurst(7), 140);
      }
      continue;
    }
    if (c.state === 'floor') {
      c.x += 22 * dt;
      addFloorBlood(c.x, dt * 0.5);
      const b = catcher(c, false);
      if (b) {
        b.items.push(itemOf(c));
        corpses.splice(i, 1);
        continue;
      }
      if (c.x > X0 + PW - 4) c.x = X0 + PW - 4;
      if (c.life <= 0) {
        addFloorBlood(c.x, 14);
        corpses.splice(i, 1);
      }
    }
  }
  if (corpses.length > CORPSE_CAP) corpses.splice(0, corpses.length - CORPSE_CAP);
}

export function tick(dt) {
  S.t += dt;
  let cap = BASE_CAP;
  for (const b of blds) if (b.t === 'tank') cap += TANK_CAP;
  S.bloodCap = cap;
  S.blood = Math.min(S.blood, cap);
  let gen = BASE_REGEN;
  for (const b of blds) {
    if (b.t !== 'gen' || b.clean > 0) continue;
    if (S.blood > 0.01) {
      const q = Math.min(S.blood, GEN_BLOOD * dt);
      S.blood -= q;
      gen += (q * GEN_GAIN) / GEN_BLOOD;
      b.glow = Math.min(1, b.glow + dt * 3);
    } else b.glow = Math.max(0, b.glow - dt * 2);
  }
  S.energy = Math.min(S.energyMax, S.energy + gen * dt);
  let demand = 0;
  for (const b of blds) if (b.clean <= 0) demand += DEF[b.t].e;
  let pf = 1;
  if (demand > 1e-4) {
    const need = demand * dt;
    if (need > S.energy) {
      pf = S.energy / need;
      S.energy = 0;
    } else S.energy -= need;
  }
  S.pf = pf;
  for (const b of blds) machine(b, dt, pf);
  fluids(dt);
  moveSticks(dt);
  moveCorpses(dt);
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.life -= dt;
    if (p.life <= 0) {
      parts.splice(i, 1);
      continue;
    }
    if (p.grav) p.vy += 620 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
}
