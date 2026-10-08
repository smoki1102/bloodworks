import { DEF } from '../../config/building-defs.js';
import { drawBandStrip } from '../bands.js';
import { housing } from '../prims.js';
import { draw as spawn } from './spawn.js';
import { draw as spike } from './spike.js';
import { draw as press } from './press.js';
import { draw as blade } from './blade.js';
import { draw as schleuder } from './schleuder.js';
import { draw as routes } from './routes.js';
import { draw as bin } from './bin.js';
import { draw as oven } from './oven.js';
import { draw as acid } from './acid.js';
import { draw as shop } from './shop.js';
import { draw as tank } from './tank.js';
import { draw as drain } from './drain.js';
import { draw as market } from './market.js';
import { draw as gen } from './gen.js';
import { draw as lab } from './lab.js';

const BY = {
  spawn,
  spike,
  press,
  blade,
  schleuder,
  weiche: routes,
  merge: routes,
  filter: routes,
  bin,
  oven,
  acid,
  shop,
  tank,
  drain,
  market,
  gen,
  lab,
};

/** Gehäuse + typspezifische Zeichnung + Bandraster für Pass-Maschinen. */
export function drawMachineBody(b, r) {
  const d = DEF[b.t];
  housing(r, d.col);
  const fn = BY[b.t];
  if (fn) fn(b, r);
  if (d.kind === 'pass') drawBandStrip(b, true);
}
