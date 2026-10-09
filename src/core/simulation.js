import { DEF } from '../config/building-defs.js';
import {
  BASE_REGEN,
  CORPSE_CAP,
  CORPSE_FLOOR_LIFE,
  GRAVITY,
  PH,
  PW,
} from '../config/constants.js';
import { addBeltBlood, addFloorBlood, bloodColor, burst, fluids, nBurst } from './effects.js';
import { bleedOut, bodyToFloorCorpse } from './anatomy.js';
import { machine, killInPlace } from './machines.js';
import { flow, updateLinks } from './flow.js';
import { rebuildNets, refreshCaps, suctionCells } from './pipes.js';
import { bldAtCell, cellAt, cellY, supportBelow } from './grid.js';
import { S, blds, corpses, floorBlood, parts, sticks } from './state.js';
import { perfBegin, perfEnd } from '../utils/perf.js';

export { machine };

const outOfWorld = (x) => x < -10 || x > PW + 10;

function landLevel(cx, cy) {
  const sup = supportBelow(cx, cy);
  return sup.bld ? cellY(sup.y) : PH;
}

function catchSink(x, y, obj) {
  const c = cellAt(x, y);
  const b = bldAtCell(c.x, c.y);
  if (!b) return false;
  const def = DEF[b.t];
  if (def.kind !== 'sink') return false;
  if (b.items.length >= (def.cap || 3)) return false;
  b.items.push({
    kind: obj.kind,
    part: obj.part,
    missing: obj.missing,
    body: obj.body,
    chair: obj.chair,
    p: 0,
    lat: 0,
    rot: 0,
    prog: 0,
    bleed: obj.bleed ?? 0.6,
  });
  S.stats.caught++;
  burst(x, y, bloodColor(), nBurst(5), 120);
  return true;
}

/** Fallende Sticks: Schwerkraft, Auffangen durch Senken, Landung. */
export function moveSticks(dt) {
  for (let i = sticks.length - 1; i >= 0; i--) {
    const s = sticks[i];
    s.vy += GRAVITY * dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.vx *= 1 - Math.min(1, dt * 0.7);
    s.rot = (s.rot || 0) + (s.spin || 0) * dt;
    if (outOfWorld(s.x)) {
      sticks.splice(i, 1);
      S.stats.escaped++;
      continue;
    }
    if (s.body && bleedOut(s.body, dt)) {
      addBeltBlood(cellAt(s.x, s.y).x, cellAt(s.x, s.y).y, 3);
    }
    const c = cellAt(s.x, s.y);
    if (catchSink(s.x, s.y, { kind: 'stick', body: s.body, chair: s.chair, bleed: 0.6 })) {
      sticks.splice(i, 1);
      continue;
    }
    const land = landLevel(c.x, c.y);
    if (s.y >= land) {
      const cell = cellAt(s.x, land - 1);
      corpses.push({
        ...bodyToFloorCorpse(s),
        x: s.x,
        y: Math.min(s.y, land),
        state: 'floor',
      });
      addFloorBlood(cell.x, cell.y, 9);
      burst(s.x, land - 6, bloodColor(), nBurst(8), 150);
      sticks.splice(i, 1);
    }
  }
}

/** Leichen und Gliedmaßen: fallen, laufen, bluten, verwesen. */
export function moveCorpses(dt) {
  for (let i = corpses.length - 1; i >= 0; i--) {
    const c = corpses[i];
    c.life -= dt;
    if (c.state === 'fall') {
      c.vy += GRAVITY * dt;
      c.y += c.vy * dt;
      c.x += (c.vx ?? 14) * dt;
      if (c.vx) c.vx *= 1 - Math.min(1, dt * 1.2);
      c.rot += (c.spin || 2.4) * dt;
      if (outOfWorld(c.x)) {
        corpses.splice(i, 1);
        continue;
      }
      const cc = cellAt(c.x, c.y);
      if (catchSink(c.x, c.y, c)) {
        corpses.splice(i, 1);
        continue;
      }
      const land = landLevel(cc.x, cc.y);
      if (c.y >= land) {
        const cell = cellAt(c.x, land - 1);
        c.y = land;
        c.vy = 0;
        c.vx = 0;
        c.state = 'floor';
        c.spin = 0;
        c.life = Math.min(c.life, CORPSE_FLOOR_LIFE);
        addFloorBlood(cell.x, cell.y, 7);
        burst(c.x, land - 4, bloodColor(), nBurst(7), 140);
      }
      continue;
    }
    if (c.state === 'floor') {
      c.x += 22 * dt;
      const cell = cellAt(c.x, c.y - 1);
      addFloorBlood(cell.x, cell.y, dt * 0.5);
      if (catchSink(c.x, c.y, c)) {
        corpses.splice(i, 1);
        continue;
      }
      if (c.x > PW - 4) c.x = PW - 4;
      if (c.life <= 0) {
        addFloorBlood(cell.x, cell.y, 14);
        corpses.splice(i, 1);
      }
    }
  }
  if (corpses.length > CORPSE_CAP) corpses.splice(0, corpses.length - CORPSE_CAP);
}

/** Waren auf Bändern und in Maschinen: Blutung und Tod. */
function stepItems(dt) {
  for (const b of blds) {
    if (!b.items.length) continue;
    for (let i = 0; i < b.items.length; i++) {
      const it = b.items[i];
      if (it.kind === 'stick' && it.body) {
        if (bleedOut(it.body, dt)) {
          addBeltBlood(b.x, b.y, 3);
          killInPlace(b, it);
        }
      } else if (it.kind === 'corpse' || it.kind === 'limb') {
        if (b.t !== 'bin') it.life -= dt * 0.25;
      }
    }
  }
}

function stepParticles(dt) {
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

export function tick(dt) {
  S.t += dt;
  perfBegin('sim.nets');
  if (S.netDirty) rebuildNets();
  refreshCaps();
  updateLinks();

  S.energy = Math.min(S.energyMax, S.energy + BASE_REGEN * dt);
  let demand = 0;
  for (const b of blds)
    if (b.clean <= 0 && b.on !== false)
      demand += DEF[b.t].e * (0.25 + 0.75 * (b.util || 0));
  let pf = 1;
  if (demand > 1e-4) {
    const need = demand * dt;
    if (need > S.energy) {
      pf = S.energy / need;
      S.energy = 0;
    } else S.energy -= need;
  }
  S.pf = pf;
  perfEnd('sim.nets');

  perfBegin('sim.machines');
  for (const b of blds) machine(b, dt, pf);
  perfEnd('sim.machines');

  perfBegin('sim.flow');
  flow(dt);
  stepItems(dt);
  perfEnd('sim.flow');

  perfBegin('sim.fluids');
  fluids(dt);
  perfEnd('sim.fluids');

  perfBegin('sim.ents');
  moveSticks(dt);
  moveCorpses(dt);
  stepParticles(dt);
  perfEnd('sim.ents');
}

/** Blut aus dem Boden in ein Netz pumpen (Debug/Hilfe). */
export function drainInto(b, q) {
  const cells = suctionCells(b.x, b.y, 1);
  let got = 0;
  for (const i of cells) {
    const take = Math.min(floorBlood[i], q - got);
    floorBlood[i] -= take;
    got += take;
  }
  return got;
}
