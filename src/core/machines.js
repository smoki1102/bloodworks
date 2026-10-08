import { DEF } from '../config/building-defs.js';
import {
  ACID_MONEY,
  ACID_TIME,
  BIN_ASH,
  BIN_BLOOD,
  BIN_ROT_TIME,
  BLADE_TIME,
  CRUSH_DMG,
  DIRT_IDLE,
  DIRT_TIME,
  DIRT_WORK,
  DRAIN_BUF,
  DRAIN_RATE,
  DRAIN_REACH,
  DRIP_TIME,
  DX,
  DY,
  GEN_BLOOD,
  GEN_GAIN,
  HIT_WINDOW,
  LAB_CLEAN_RATE,
  OVEN_ASH,
  OVEN_ENERGY,
  OVEN_TIME,
  PART_VALUE,
  PRESS_PERIOD,
  ROUTE_TIME,
  SCHLEUDER_KICK,
  EJECT_LIFT,
  SHOP_TIME,
  SPAWN_BASE,
  SPAWN_FIRST,
  SPAWN_MIN,
  SPAWN_RAMP,
  SPIKE_HITS,
  rotR,
} from '../config/constants.js';
import { bloodColor, burst, floatText, nBurst } from './effects.js';
import { noteOut, noteRate } from './flow.js';
import { bldAtCell, cellX, cellY, idx, inGrid, portsOf } from './grid.js';
import { addBlood, availBlood, suctionCells, takeBlood } from './pipes.js';
import { itemPos, roomIn, stepTransport, exitCellOf, feed } from './belts.js';
import { stepMarket, priceOf } from './market.js';
import {
  PARTS,
  aliveLimbs,
  filterMatch,
  isDead,
  limbItem,
  makeBody,
  maxLimbs,
  missingOf,
  severPart,
  wound,
} from './anatomy.js';
import { S, blds, sticks, corpses, floorBlood } from './state.js';
import { upgEff } from './upgrades.js';
import { clamp, rnd } from '../utils/helpers.js';
import { addBeltBlood } from './effects.js';

export const capOf = (t) => DEF[t].cap ?? 0;

/** Fortschrittsfaktor einer Arbeit: Dreck zieht mit. */
export const runFactor = (b, pf) =>
  pf * clamp(1 - b.dirt / 150, 0.2, 1) * (S.fx?.machSpeed ?? 1);

const mkStick = () => ({
  kind: 'stick',
  p: 0,
  lat: 0,
  chair: true,
  anim: rnd() * 9,
  body: makeBody(),
  dripT: 0,
});

/** Ware in der Hand eines Geräts töten – sie wird zur Leiche. */
export function killInPlace(b, it) {
  if (it.kind !== 'stick') return;
  const body = it.body;
  it.kind = 'corpse';
  it.missing = body ? missingOf(body) : [];
  it.body = null;
  it.held = false;
  it.bleed = 0.6;
  S.kills++;
  const pos = itemPos(b, it);
  if (it.chair) {
    it.chair = false;
    chairBits(pos.x, pos.y);
  }
  burst(pos.x, pos.y - 8, bloodColor(), nBurst(9), 190);
}

function chairBits(x, y) {
  burst(x, y, '#7c8a9a', 3, 130);
}

/* ---------------------------------- Quelle ---------------------------------- */

function stepSpawn(b, dt, pf) {
  const c = exitCellOf(b, b.dir ?? 0, 0);
  const t = bldAtCell(c.x, c.y);
  if (!t || DEF[t.t].kind !== 'belt') return false;
  if (pf <= 0.2) return false;
  b.timer = (b.timer ?? SPAWN_FIRST) - dt;
  if (b.timer > 0) return false;
  b.timer =
    Math.max(SPAWN_MIN, SPAWN_BASE - S.t / SPAWN_RAMP) * upgEff('spawn');
  if (!roomIn(t)) return false;
  t.items.push(mkStick());
  S.spawned = (S.spawned || 0) + 1;
  b.pulse = 0.4;
  return true;
}

/* ------------------------------ Durchlauf-Maschinen ------------------------------ */

const PART_NAME = {
  head: 'Kopf',
  torso: 'Torso',
  armL: 'Arm',
  armR: 'Arm',
  legL: 'Bein',
  legR: 'Bein',
};

const groupParts = (g) =>
  g === 'head'
    ? ['head']
    : g === 'torso'
      ? ['torso']
      : g === 'arms'
        ? ['armL', 'armR']
        : g === 'legs'
          ? ['legL', 'legR']
          : [];

function spikeHit(b, it) {
  const body = it.body;
  if (!body || S.gore === 0) return killInPlace(b, it);
  body.hits++;
  if (body.hits >= SPIKE_HITS || body.lost >= maxLimbs() || !aliveLimbs(body).length)
    return killInPlace(b, it);
  const alive = aliveLimbs(body);
  const part = alive[Math.floor(rnd() * alive.length)];
  body.php[part] -= 40 * (S.fx?.machDmg ?? 1);
  body.hp -= 15;
  if (body.php[part] <= 0 && severPart(body, part)) spawnLimb(b, it, part);
  if (isDead(body)) killInPlace(b, it);
}

/** Trefferquote beim gezielten Abtrennen – steigt über den Skill-Tree. */
export const hitChance = () => clamp(0.45 + (S.fx?.hit ?? 0), 0, 0.95);

export function bladeCut(b, it) {
  const body = it.body;
  if (!body) return;
  const grp = groupParts(b.target);
  const present = grp.filter((p) => body.limbs[p]);
  const all = PARTS.filter((p) => body.limbs[p]);
  const chance = hitChance();
  let part = null;
  if (present.length && rnd() < chance) part = present[Math.floor(rnd() * present.length)];
  else if (all.length) part = all[Math.floor(rnd() * all.length)];
  let cut = null;
  if (part && severPart(body, part)) {
    cut = part;
    spawnLimb(b, it, part);
  }
  // Mehrfachziele (Skill „Präzision“): zusätzliche Treffer in der Zielgruppe.
  for (let k = 0, extra = Math.floor(S.fx?.multi ?? 0); k < extra; k++) {
    const live = grp.filter((p) => body.limbs[p]);
    if (!live.length) break;
    const p2 = live[Math.floor(rnd() * live.length)];
    if (severPart(body, p2)) spawnLimb(b, it, p2);
  }
  if (isDead(body)) killInPlace(b, it);
  else if (cut) {
    const pos = itemPos(b, it);
    floatText(pos.x, pos.y - 14, '-' + (PART_NAME[cut] || cut), bloodColor());
  }
}

function spawnLimb(b, it, part) {
  const limb = limbItem(part);
  limb.p = Math.max(0, (it.p || 0) - 0.3);
  limb.lat = it.lat || 0;
  b.items.push(limb);
  const pos = itemPos(b, it);
  burst(pos.x, pos.y - 8, bloodColor(), nBurst(6), 160);
  b.pulse = 0.5;
}

function ejectItem(b, it) {
  const pos = itemPos(b, it);
  const d = rotR(b.dir ?? 0);
  const obj = {
    ...it,
    x: pos.x,
    y: pos.y,
    vx: DX[d] * SCHLEUDER_KICK * (0.6 + rnd() * 0.7),
    vy: EJECT_LIFT,
    rot: it.rot || 0,
    spin: (rnd() - 0.5) * 5,
    state: 'fall',
    p: undefined,
    lat: undefined,
    held: undefined,
    prog: undefined,
  };
  if (it.kind === 'stick') {
    S.ejected++;
    if (it.chair) {
      it.chair = false;
      chairBits(pos.x, pos.y);
    }
    sticks.push(obj);
  } else corpses.push(obj);
  burst(pos.x, pos.y, bloodColor(), nBurst(4), 120);
  b.pulse = 0.5;
}

function workPass(b, run) {
  return (it, i, dt) => {
    if (b.t !== 'schleuder' && it.kind !== 'stick') {
      it.held = false;
      return false;
    }
    it.prog = (it.prog || 0) + dt * run;
    if (b.t === 'schleuder') {
      ejectItem(b, it);
      return true;
    }
    if (b.t === 'press') {
      if (it.prog < PRESS_PERIOD) return false;
      it.prog -= PRESS_PERIOD;
      b.pulse = 0.5;
      if (wound(it.body, CRUSH_DMG * (S.fx?.machDmg ?? 1))) killInPlace(b, it);
      return false;
    }
    const span = b.t === 'spike' ? SPIKE_HITS * HIT_WINDOW : BLADE_TIME;
    if (b.t === 'spike' && it.prog - (it.hitT || 0) >= HIT_WINDOW) {
      it.hitT = it.prog;
      spikeHit(b, it);
      if (it.kind !== 'stick') return false;
    }
    if (it.prog >= span) {
      if (b.t === 'blade') bladeCut(b, it);
      it.held = false;
    }
    return false;
  };
}

/* --------------------------------- Routen --------------------------------- */

function tryEject(b, it, d) {
  const c = exitCellOf(b, d, 0);
  if (!inGrid(c.x, c.y)) {
    S.escaped++;
    return true;
  }
  const target = bldAtCell(c.x, c.y);
  if (!target) {
    const pos = itemPos(b, it);
    const obj = {
      ...it,
      x: pos.x + DX[d] * 8,
      y: pos.y + DY[d] * 8,
      vx: DX[d] * 40,
      vy: DY[d] * 40,
      state: 'fall',
      p: undefined,
      lat: undefined,
      held: undefined,
    };
    if (it.kind === 'stick') sticks.push(obj);
    else corpses.push(obj);
    return true;
  }
  if (target === b) return false;
  if (DEF[target.t].kind === 'belt') {
    if (!roomIn(target)) return false;
    target.items.push({ ...it, p: 0, lat: 0, held: false });
    return true;
  }
  return feed(target, it, d, c);
}

function stepRoute(b, dt, pf, run) {
  if (!b.items.length) return false;
  b.timer = (b.timer ?? 0) - dt * run;
  if (b.timer > 0) return false;
  b.timer = ROUTE_TIME;
  const it = b.items[0];
  const outs = portsOf(b).out;
  if (!outs.length) return false;
  let d;
  if (b.t === 'filter') {
    const m = filterMatch(it, b.filter);
    d = outs[m ? 0 : Math.min(1, outs.length - 1)];
  } else {
    const a = b.alt || 0;
    d = outs[a % outs.length];
    b.alt = a + 1;
  }
  if (tryEject(b, it, d)) {
    b.items.shift();
    b.pulse = 0.4;
    return true;
  }
  return false;
}

/* --------------------------------- Senken --------------------------------- */

function addBinBlood(b) {
  const per = BIN_BLOOD / Math.max(1, b.spanW * b.spanH);
  for (let y = b.y; y < b.y + b.spanH; y++)
    for (let x = b.x; x < b.x + b.spanW; x++) {
      const i = idx(x, y);
      floorBlood[i] = Math.min(11, floorBlood[i] + per);
    }
  const c = { x: cellX(b.x) + (b.spanW * 48) / 2, y: cellY(b.y + b.spanH) };
  burst(c.x, c.y - 8, bloodColor(), nBurst(4), 90);
  floatText(c.x, c.y - 30, '+' + BIN_BLOOD, bloodColor());
}

const valueOf = (it) => {
  if (it.kind === 'limb') return PART_VALUE[it.part] || 0;
  if (it.kind === 'stick') {
    const body = it.body;
    if (!body) return 0;
    return PARTS.reduce((a, p) => a + (body.limbs[p] ? PART_VALUE[p] : 0), 0);
  }
  return PARTS.reduce((a, p) => a + ((it.missing || []).indexOf(p) < 0 ? PART_VALUE[p] : 0), 0);
};

function stepSink(b, dt, run) {
  if (!b.items.length) return false;
  if (b.t === 'bin') {
    let done = false;
    for (let i = b.items.length - 1; i >= 0; i--) {
      const it = b.items[i];
      it.rot = (it.rot || 0) + dt * run;
      if (it.rot >= BIN_ROT_TIME) {
        b.items.splice(i, 1);
        addBinBlood(b);
        S.ash += BIN_ASH;
        noteOut(b, S.t);
        done = true;
      }
    }
    b.glow = Math.min(1, b.glow + dt);
    return done || b.items.length > 0;
  }
  if (b.t === 'oven' || b.t === 'acid' || b.t === 'shop') {
    const time = b.t === 'oven' ? OVEN_TIME : b.t === 'acid' ? ACID_TIME : SHOP_TIME;
    b.prog = (b.prog || 0) + dt * run;
    b.glow = Math.min(1, b.glow + dt * 2);
    if (b.prog < time) return true;
    b.prog = 0;
    const it = b.items.shift();
    if (!it) return false;
    if (b.t === 'oven') {
      S.energy = Math.min(S.energyMax, S.energy + OVEN_ENERGY * (S.fx?.oven ?? 1));
      S.ash += OVEN_ASH;
    } else if (b.t === 'acid') S.money += ACID_MONEY;
    else S.money += Math.round(valueOf(it) * priceOf() * 8);
    noteOut(b, S.t);
    b.pulse = 0.5;
    return true;
  }
  return false;
}

/* ------------------------- Markt / Generator / Abfluss / Reinigung ------------------------- */

function stepGen(b, dt) {
  if (b.link !== 'ok') return false;
  const have = availBlood(b);
  if (have < 0.01) {
    b.glow = Math.max(0, b.glow - dt * 2);
    return false;
  }
  const q = Math.min(have, GEN_BLOOD * dt);
  takeBlood(b, q);
  const gain = ((q * GEN_GAIN) / GEN_BLOOD) * (S.fx?.gen ?? 1);
  S.energy = Math.min(S.energyMax, S.energy + gain);
  b.glow = Math.min(1, b.glow + dt * 3);
  noteRate(b, q / dt, dt);
  return true;
}

function stepDrain(b, dt, pf, run) {
  if (pf < 0.1) return false;
  let got = 0;
  if (b.buf < DRAIN_BUF) {
    const cells = suctionCells(b.x, b.y, DRAIN_REACH);
    let want = (DRAIN_RATE * dt * run) / cells.length;
    for (const i of cells) {
      const take = Math.min(floorBlood[i], want);
      floorBlood[i] -= take;
      got += take;
    }
    b.buf = Math.min(DRAIN_BUF, b.buf + got);
  }
  let worked = got > 0;
  if (b.link === 'ok' && b.buf > 0.01) {
    const flush = Math.min(b.buf, DRAIN_RATE * dt * run);
    const a = addBlood(b, flush);
    b.buf -= a;
    if (a > 0) {
      worked = true;
      noteRate(b, a / dt, dt);
    }
  }
  b.glow = b.buf > 0.5 ? Math.min(1, b.glow + dt * 4) : b.glow;
  return worked;
}

function stepLab(b, dt, pf) {
  if (pf < 0.1) return false;
  for (const o of blds)
    if (o.dirt > 0 && o.clean <= 0)
      o.dirt = Math.max(0, o.dirt - LAB_CLEAN_RATE * dt * pf * (S.fx?.machDirt ?? 1));
  b.glow = 0.5;
  return true;
}

/* --------------------------------- Takt --------------------------------- */

function drip(b, dt) {
  for (const it of b.items) {
    if (it.kind === 'stick' && it.body && it.body.bleeding > 0) {
      it.dripT = (it.dripT || 0) - dt;
      if (it.dripT <= 0) {
        it.dripT = DRIP_TIME;
        addBeltBlood(b.x, b.y, Math.min(1.2, it.body.bleeding / 12));
      }
    } else if (it.kind === 'limb' && it.bleed > 0) {
      it.bleed -= dt;
      if (it.bleed <= 0) {
        it.bleed = 0;
        addBeltBlood(b.x, b.y, 0.5);
      }
    } else if (it.kind === 'corpse' && it.bleed > 0) {
      it.bleed -= dt;
      if (it.bleed <= 0) {
        it.bleed = 1.3;
        addBeltBlood(b.x, b.y, 1.1);
      }
    }
  }
}

/**
 * Ein Geräte-Tick. Reihenfolge: Reinigung → Aus → Fortschritt → Typ-Verhalten.
 * @returns {boolean} true, wenn das Gerät in diesem Tick gearbeitet hat
 */
export function machine(b, dt, pf) {
  const d = DEF[b.t];
  if (b.clean > 0) {
    b.clean -= dt;
    if (b.clean <= 0) {
      b.clean = 0;
      b.dirt = 0;
    }
    b.worked = false;
    return false;
  }
  if (b.on === false) {
    b.worked = false;
    return false;
  }
  const run = runFactor(b, pf);
  let worked = false;
  const k = d.kind;

  if (k === 'src') worked = stepSpawn(b, dt, pf);
  else if (k === 'belt') {
    stepTransport(b, dt, null);
    worked = b.items.length > 0;
  } else if (k === 'pass') {
    stepTransport(b, dt, workPass(b, run));
    worked = b.items.length > 0;
  } else if (k === 'route') worked = stepRoute(b, dt, pf, run);
  else if (k === 'sink') worked = stepSink(b, dt, run);
  else if (k === 'market') {
    worked = stepMarket(b, dt, pf, run) > 0;
    if (!worked) b.glow = Math.max(0, b.glow - dt * 2);
    else b.glow = Math.min(1, b.glow + dt * 3);
  } else if (k === 'gen') worked = stepGen(b, dt);
  else if (k === 'drain') worked = stepDrain(b, dt, pf, run);
  else if (k === 'clean') worked = stepLab(b, dt, pf);

  if (d.dirt) {
    const byWork = k === 'belt' ? DIRT_TIME : worked ? DIRT_WORK : DIRT_IDLE;
    b.dirt = Math.min(100, b.dirt + d.dirt * dt * byWork * (S.fx?.machDirt ?? 1));
  }
  drip(b, dt);
  b.worked = worked;
  return worked;
}
