import { DEF } from '../config/building-defs.js';
import {
  BASE_CAP,
  BASE_REGEN,
  BELT_SPEED,
  BELT_Y,
  COLS,
  KELLER_FLOOR,
  PW,
  TANK_CAP,
  X0,
} from '../config/constants.js';
import { addBeltBlood, addFloorBlood, bloodColor, burst, floatText, nBurst } from './effects.js';
import { bldRect } from './placement.js';
import { S, beltBlood, blds, corpses, floorBlood, occ, parts, sticks } from './state.js';
import { clamp, colAt, colCX, rnd } from '../utils/helpers.js';

export function killStick(i) {
  const s = sticks[i];
  corpses.push({ x: s.x, y: BELT_Y, vx: 0, vy: 0, rot: 0, state: 'belt', bleed: 0.6, life: 120 });
  sticks.splice(i, 1);
  S.kills++;
  addBeltBlood(s.x, 6);
  addFloorBlood(s.x, 2.5);
  burst(s.x, BELT_Y - 16, bloodColor(), nBurst(9), 190);
}

export function machine(b, dt, pf) {
  const d = DEF[b.t],
    r = bldRect(b),
    mx = r.x + r.w / 2;
  if (b.clean > 0) {
    b.clean -= dt;
    if (b.clean <= 0) {
      b.clean = 0;
      b.dirt = 0;
    }
    return;
  }
  const run = pf * clamp(1 - b.dirt / 150, 0.2, 1);
  if (d.dirt) b.dirt = Math.min(100, b.dirt + d.dirt * dt * 0.55);
  if (b.t === 'press') b.phase += dt * 1.2 * run;
  if (b.t === 'market' && S.blood > 0.01 && pf > 0.15) {
    const q = Math.min(S.blood, 9 * dt * run);
    S.blood -= q;
    S.money += q * 1.4;
    S.sold += q;
  }
  if (b.t === 'drain' && pf > 0.1 && S.bloodCap > S.blood) {
    let got = 0;
    for (let c = b.col; c < b.col + b.w; c++) {
      const take = Math.min(floorBlood[c], (34 * dt * run) / b.w);
      floorBlood[c] -= take;
      got += take;
    }
    got = Math.min(got, S.bloodCap - S.blood);
    S.blood += got;
    b.glow = got > 0.2 ? Math.min(1, b.glow + dt * 4) : Math.max(0, b.glow - dt * 2);
  }
  if (b.t === 'bin') {
    for (let i = b.items.length - 1; i >= 0; i--) {
      const it = b.items[i];
      it.rot += dt * run;
      if (it.rot >= 9) {
        b.items.splice(i, 1);
        S.blood = Math.min(S.bloodCap, S.blood + 22);
        S.ash += 4;
        burst(mx, KELLER_FLOOR - 20, bloodColor(), nBurst(4), 90);
        floatText(mx, KELLER_FLOOR - 60, '+22', bloodColor());
      }
    }
    if (b.items.length) b.dirt = Math.min(100, b.dirt + dt * 0.5);
  }
  if (b.t === 'oven') {
    if (b.items.length) {
      b.prog += dt * run;
      b.glow = Math.min(1, b.glow + dt * 2);
      if (b.prog >= 1.4) {
        b.prog = 0;
        b.items.pop();
        S.energy = Math.min(S.energyMax, S.energy + 32);
        S.ash += 6;
        burst(mx, KELLER_FLOOR - 60, '#eee', 6, 100);
        floatText(mx, KELLER_FLOOR - 90, '+32 ⚡', '#ddd');
      }
    } else b.glow = Math.max(0, b.glow - dt * 1.5);
  }
  if (b.t === 'acid' && b.items.length) {
    b.prog += dt * run;
    if (b.prog >= 1.7) {
      b.prog = 0;
      b.items.pop();
      S.money += 22;
      burst(mx, KELLER_FLOOR - 30, '#9b9', 5, 90);
      floatText(mx, KELLER_FLOOR - 70, '+22 €', '#ddd');
    }
  }
  if (b.t === 'lab' && pf > 0.1) {
    for (const o of blds)
      if (o.dirt > 0 && o.clean <= 0) o.dirt = Math.max(0, o.dirt - 7 * dt * pf);
    b.glow = 0.5;
  }
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
  if (sp && sp.clean <= 0) {
    S.spawnTimer -= dt;
    if (S.spawnTimer <= 0) {
      S.spawnTimer = Math.max(1.6, 4.4 - S.t / 150);
      sticks.push({ x: colCX(sp.col), y: BELT_Y, vy: 0, anim: rnd() * 9, state: 'walk' });
    }
  }
  for (let i = sticks.length - 1; i >= 0; i--) {
    const s = sticks[i];
    s.anim += dt;
    if (s.state === 'fall') {
      s.vy += 1500 * dt;
      s.y += s.vy * dt;
      s.x += 12 * dt;
      if (s.y >= KELLER_FLOOR - 2) {
        corpses.push({
          x: s.x,
          y: KELLER_FLOOR,
          vx: 0,
          vy: 0,
          rot: 0,
          state: 'floor',
          bleed: 1,
          life: 90,
        });
        addFloorBlood(s.x, 9);
        burst(s.x, KELLER_FLOOR - 10, bloodColor(), nBurst(8), 150);
        sticks.splice(i, 1);
      }
      continue;
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
      if (d.kill === 'contact' || b.phase % 1.4 < 0.5) {
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
      b.items.length < (b.t === 'bin' ? 9 : 3)
    )
      return b;
  }
  return null;
}
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
        c.bleed -= dt;
        if (c.bleed <= 0) {
          c.bleed = 1.3;
          addBeltBlood(c.x, 1.1);
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
      c.x += 14 * dt;
      c.rot += dt * 2.4;
      const b = catcher(c, true);
      if (b) {
        b.items.push({ rot: 0 });
        burst(c.x, c.y, bloodColor(), nBurst(5), 120);
        corpses.splice(i, 1);
        continue;
      }
      if (c.y >= KELLER_FLOOR - 2) {
        c.y = KELLER_FLOOR;
        c.vy = 0;
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
        b.items.push({ rot: 0 });
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
  if (corpses.length > 60) corpses.splice(0, corpses.length - 60);
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
      const q = Math.min(S.blood, 8 * dt);
      S.blood -= q;
      gen += (q * 15) / 8;
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
