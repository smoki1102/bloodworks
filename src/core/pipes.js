import { BASE_CAP, DX, DY, GRID_H, GRID_W, TANK_CAP } from '../config/constants.js';
import { S, blds, bmap, nets, occ } from './state.js';
import { eachCell, idx, inGrid } from './grid.js';
import { upgEff } from './upgrades.js';

/** Gebäudetypen, die an Pipe-Netzen hängen (Tank brückt Netze). */
const CONNECTED = new Set(['tank', 'market', 'drain', 'gen']);

let dirty = true;
export const markNetsDirty = () => {
  dirty = true;
  S.netDirty = true;
};
export const netsDirty = () => dirty || S.netDirty;

const parent = [];
const find = (a) => {
  while (parent[a] !== a) {
    parent[a] = parent[parent[a]];
    a = parent[a];
  }
  return a;
};
const union = (a, b) => {
  a = find(a);
  b = find(b);
  if (a !== b) parent[b] = a;
};

/**
 * Flood-Fill über alle Pipe-Zellen, Union-Find über Rohrfragmente,
 * die ein Gebäude (v.a. ein Tank) berührt. Dadurch werden Netze verbunden.
 */
export function rebuildNets() {
  dirty = false;
  S.netDirty = false;
  const prev = nets.map((n) => ({ v: n.v, ids: n.ids.slice(), used: false }));

  const comp = new Int32Array(GRID_W * GRID_H).fill(-1);
  let nc = 0;
  for (const b of blds) {
    if (b.t !== 'pipe') continue;
    eachCell(b, (x, y) => {
      const i = idx(x, y);
      if (comp[i] !== -1) return;
      const stack = [i];
      comp[i] = nc;
      while (stack.length) {
        const c = stack.pop();
        const cx = c % GRID_W,
          cy = (c / GRID_W) | 0;
        for (let d = 0; d < 4; d++) {
          const nx = cx + DX[d],
            ny = cy + DY[d];
          if (!inGrid(nx, ny)) continue;
          const j = idx(nx, ny);
          if (comp[j] !== -1 || occ[j] <= 0) continue;
          const t = bmap.get(occ[j]);
          if (!t || t.t !== 'pipe') continue;
          comp[j] = nc;
          stack.push(j);
        }
      }
      nc++;
    });
  }

  parent.length = 0;
  for (let i = 0; i < nc; i++) parent[i] = i;

  const touchedBy = new Map();
  for (const b of blds) {
    if (!CONNECTED.has(b.t)) continue;
    const roots = new Set();
    eachCell(b, (x, y) => {
      for (let d = 0; d < 4; d++) {
        const nx = x + DX[d],
          ny = y + DY[d];
        if (!inGrid(nx, ny)) continue;
        const c = comp[idx(nx, ny)];
        if (c >= 0) roots.add(c);
      }
    });
    if (roots.size) touchedBy.set(b.id, [...roots]);
    const arr = [...roots];
    for (let i = 1; i < arr.length; i++) union(arr[0], arr[i]);
  }

  const byRoot = new Map();
  for (const [bid, roots] of touchedBy) {
    const r = find(roots[0]);
    if (!byRoot.has(r)) byRoot.set(r, []);
    byRoot.get(r).push(bid);
  }

  nets.length = 0;
  for (const ids of byRoot.values()) {
    const net = { id: nets.length, v: 0, cap: 0, ids: ids.sort((a, b) => a - b), blds: [] };
    for (const id of ids) {
      const b = bmap.get(id);
      if (b) {
        net.blds.push(b);
        b.netId = net.id;
      }
    }
    const hit = prev.find((p) => !p.used && p.ids.length === net.ids.length && p.ids.every((v, i) => v === net.ids[i]));
    if (hit) {
      net.v = hit.v;
      hit.used = true;
    } else {
      const near = prev.find((p) => !p.used && p.ids.some((v) => net.ids.includes(v)));
      if (near) {
        net.v = near.v;
        near.used = true;
      }
    }
    nets.push(net);
  }
  for (const b of blds) if (b.netId == null) b.netId = -1;
  for (const n of nets) n.cap = netCap(n);
}

function netCap(n) {
  let c = 0;
  for (const b of n.blds) if (b.t === 'tank') c += TANK_CAP + (S.fx?.tankCap || 0);
  return c;
}

export const netOf = (b) => (b.netId != null && b.netId >= 0 ? nets[b.netId] || null : null);
export const netHasTank = (n) => !!n && n.blds.some((b) => b.t === 'tank');
export const worldTankCount = () => blds.filter((b) => b.t === 'tank').length;

/** Kapazität des globalen Pools (Basis + freistehende Tanks). */
export function globalCap() {
  let c = BASE_CAP + upgEff('tank');
  for (const b of blds)
    if (b.t === 'tank' && (b.netId == null || b.netId < 0)) c += TANK_CAP + (S.fx?.tankCap || 0);
  return c;
}

export function refreshCaps() {
  S.bloodCap = globalCap();
  for (const n of nets) n.cap = netCap(n);
}

/** Blut in den Pool des Gebäudes einspeisen (gedrosselt durch die Kapazität). */
export function addBlood(b, q) {
  const n = netOf(b);
  if (n) {
    const a = Math.min(q, Math.max(0, n.cap - n.v));
    n.v += a;
    return a;
  }
  const a = Math.min(q, Math.max(0, S.bloodCap - S.blood));
  S.blood += a;
  return a;
}

/** Blut aus dem Pool des Gebäudes entnehmen. */
export function takeBlood(b, q) {
  const n = netOf(b);
  if (n) {
    const a = Math.min(q, n.v);
    n.v -= a;
    return a;
  }
  const a = Math.min(q, S.blood);
  S.blood -= a;
  return a;
}

export const availBlood = (b) => {
  const n = netOf(b);
  return n ? n.v : S.blood;
};

export const bloodTotal = () => S.blood + nets.reduce((a, n) => a + n.v, 0);
export const bloodCapTotal = () => S.bloodCap + nets.reduce((a, n) => a + n.cap, 0);

/** Bezahlt aus dem globalen Pool und danach aus den Netzen. */
export function spendBlood(n) {
  if (bloodTotal() < n) return false;
  let rest = Math.min(n, S.blood);
  S.blood -= rest;
  rest = n - rest;
  for (const net of nets) {
    if (rest <= 0) break;
    const t = Math.min(rest, net.v);
    net.v -= t;
    rest -= t;
  }
  return rest <= 0;
}

/** Blutboden in der Nähe eines Abflusses. */
export function suctionCells(x, y, reach) {
  const out = [];
  for (let dy = -reach; dy <= reach; dy++)
    for (let dx = -reach; dx <= reach; dx++) {
      const nx = x + dx,
        ny = y + dy;
      if (inGrid(nx, ny)) out.push(idx(nx, ny));
    }
  return out;
}
