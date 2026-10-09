/**
 * Bandstrecke von einem Start- zu einem Endpunkt: Plant eine Route aus
 * Diagonalen (45°) und geradem Rest – beide Reihenfolgen, die freie gewinnt
 * – und baut sie auf einmal. Bestehende Bandzellen werden übernommen (nur
 * umdirigiert, keine Kosten), alles andere blockiert die Strecke komplett.
 *
 * Die Simulation bleibt unverändert: eine Strecke ist eine Reihe von
 * Einzelbändern (1 × 1) wie bisher.
 */
import { DX, DY, dirOf, opp } from '../config/constants.js';
import { DEF } from '../config/building-defs.js';
import { bldAtCell, inGrid } from './grid.js';
import { addBuilding, autoDir, costOf, pushGroup } from './placement.js';
import { S } from './state.js';

const key = (x, y) => x + ':' + y;

/** Zellen von (x0,y0) bis (x1,y1) entlang einer Achse, inklusive beiden Enden. */
function line(x0, y0, x1, y1) {
  const cells = [];
  const dx = Math.sign(x1 - x0),
    dy = Math.sign(y1 - y0);
  let x = x0,
    y = y0;
  cells.push({ x, y });
  while (x !== x1 || y !== y1) {
    x += dx;
    y += dy;
    cells.push({ x, y });
  }
  return cells;
}

/** Route: Diagonalanteil (45°) + gerader Rest; `diagFirst` bestimmt die Reihenfolge. */
function route(x0, y0, x1, y1, diagFirst) {
  if (y0 === y1 || x0 === x1) return line(x0, y0, x1, y1);
  const sx = Math.sign(x1 - x0),
    sy = Math.sign(y1 - y0);
  const diagLen = Math.min(Math.abs(x1 - x0), Math.abs(y1 - y0));
  // Rest entlang der längeren Achse:
  const rx = Math.abs(x1 - x0) > Math.abs(y1 - y0) ? sx : 0;
  const ry = Math.abs(y1 - y0) > Math.abs(x1 - x0) ? sy : 0;
  const rest = Math.abs(Math.abs(x1 - x0) - Math.abs(y1 - y0));
  const diag = [];
  const straight = [];
  if (diagFirst) {
    for (let i = 1; i <= diagLen; i++) diag.push({ x: x0 + sx * i, y: y0 + sy * i });
    for (let i = 1; i <= rest; i++) straight.push({ x: x0 + sx * diagLen + rx * i, y: y0 + sy * diagLen + ry * i });
    return [{ x: x0, y: y0 }, ...diag, ...straight];
  }
  for (let i = 1; i <= rest; i++) straight.push({ x: x0 + rx * i, y: y0 + ry * i });
  for (let i = 1; i <= diagLen; i++) diag.push({ x: x0 + rx * rest + sx * i, y: y0 + ry * rest + sy * i });
  return [{ x: x0, y: y0 }, ...straight, ...diag];
}

/** Richtungen entlang der Zellenliste (letzte Zelle: Richtung des letzten Segments). */
function withDirs(cells) {
  if (cells.length === 1) {
    const dir = autoDir(cells[0].x, cells[0].y, S.dir);
    return [{ ...cells[0], dir, from: dir }];
  }
  return cells.map((c, i) => {
    const a = i === cells.length - 1 ? cells[i - 1] : c;
    const b = i === cells.length - 1 ? c : cells[i + 1];
    const dir = dirOf(b.x - a.x, b.y - a.y);
    const from = i === 0 ? dir : dirOf(c.x - cells[i - 1].x, c.y - cells[i - 1].y);
    return { ...c, dir, from };
  });
}

/** Grund, warum die Zellenliste nicht baubar ist – sonst null. */
function check(cells) {
  const dirs = new Map(cells.map((c) => [key(c.x, c.y), c.dir]));
  let fresh = 0;
  for (const c of cells) {
    if (!inGrid(c.x, c.y)) return 'Außerhalb der Fabrik';
    const b = bldAtCell(c.x, c.y);
    if (b) {
      if (b.t !== 'belt') return `Blockiert: ${DEF[b.t].n} (${c.x},${c.y})`;
    } else {
      fresh++;
    }
    const nx = c.x + DX[c.dir],
      ny = c.y + DY[c.dir];
    let nd = dirs.get(key(nx, ny));
    if (nd === undefined) {
      const n = bldAtCell(nx, ny);
      nd = n && n.t === 'belt' ? n.dir : null;
    }
    if (nd === opp(c.dir)) return 'Schleifenbildung';
  }
  const cost = fresh * costOf('belt');
  if (cost > S.money) return 'Zu teuer: ' + cost + ' €';
  return null;
}

/**
 * Route von A nach B planen – ohne etwas zu bauen.
 * @returns {{cells:Array, cost:number, reason:string|null}} Zellen mit
 *   Richtung, Kosten für neue Zellen und ggf. den Abbruchgrund
 *   (die Zellen beschreiben dann den Versuch, damit die Vorschau rot zeichnen kann)
 */
export function planBeltPath(x0, y0, x1, y1) {
  const cands = [route(x0, y0, x1, y1, true), route(x0, y0, x1, y1, false)].map(withDirs);
  let best = cands[0];
  let firstReason = null;
  for (const c of cands) {
    const r = check(c);
    if (!r) return { cells: c, cost: cost(c), reason: null };
    if (!firstReason) firstReason = r;
    if (c.length < best.length) best = c;
  }
  return { cells: best, cost: cost(best), reason: firstReason };
}

const cost = (cells) => cells.filter((c) => !bldAtCell(c.x, c.y)).length * costOf('belt');

/**
 * Geplante Strecke bauen: alles-oder-nichts, eine Rückgängig-Einheit.
 * @returns {object} Plan von `planBeltPath`
 */
export function buildBeltPath(x0, y0, x1, y1) {
  const plan = planBeltPath(x0, y0, x1, y1);
  if (plan.reason) return plan;
  const created = [];
  for (const c of plan.cells) {
    const ex = bldAtCell(c.x, c.y);
    if (ex) {
      ex.dir = c.dir;
      ex.fromDir = c.from;
      continue;
    }
    const b = addBuilding('belt', c.x, c.y, { free: true, dir: c.dir, fromDir: c.from });
    if (b) created.push(b);
  }
  S.money -= plan.cost;
  pushGroup(true, created, plan.cost);
  return plan;
}
