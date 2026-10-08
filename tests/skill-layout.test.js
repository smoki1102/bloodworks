import { describe, it, expect } from 'vitest';
import './dom-stub.js';
import { skillLayout } from '../src/ui/skill.js';
import { BRANCHES, SKILL } from '../src/config/skill-defs.js';

const rect = (b) => ({ l: b.x, t: b.y, r: b.x + b.w, b: b.y + b.h });
const hits = (a, b) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;

describe('Skill-Netz Layout', () => {
  it('positioniert jeden Knoten genau einmal', () => {
    const L = skillLayout();
    expect(L.nodes).toHaveLength(SKILL.length);
    expect(new Set(L.nodes.map((n) => n.id)).size).toBe(SKILL.length);
    expect(L.tags).toHaveLength(BRANCHES.length);
  });

  it('lässt keine zwei Knoten überlappen', () => {
    const boxes = skillLayout().nodes.map(rect);
    const clashes = [];
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++)
        if (hits(boxes[i], boxes[j])) clashes.push([i, j]);
    expect(clashes).toEqual([]);
  });

  it('hält Knoten und Tags innerhalb der Fläche', () => {
    const L = skillLayout();
    for (const b of L.nodes) {
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.x + b.w).toBeLessThanOrEqual(L.w);
      expect(b.y + b.h).toBeLessThanOrEqual(L.h);
    }
    for (const t of L.tags) {
      expect(t.x).toBeGreaterThanOrEqual(0);
      expect(t.y).toBeGreaterThanOrEqual(0);
      expect(t.x).toBeLessThan(L.w);
      expect(t.y).toBeLessThan(L.h);
    }
  });

  it('hängt jedes req an seinen Vorgänger und zieht die Kante nach rechts', () => {
    const L = skillLayout();
    const byId = new Map(L.nodes.map((n) => [n.id, n]));
    let checked = 0;
    for (const b of L.nodes)
      for (const [rid] of b.def.req || []) {
        const p = byId.get(rid);
        expect(p, `Vorgänger ${rid} existiert`).toBeTruthy();
        const e = L.edges.find((x) => x.x1 === p.x + p.w && x.x2 === b.x && x.y2 === b.y + 34);
        expect(e, `Kante ${rid} -> ${b.id}`).toBeTruthy();
        expect(e.x1).toBeLessThan(e.x2);
        checked++;
      }
    expect(checked).toBe(L.edges.length);
    expect(checked).toBeGreaterThan(0);
  });

  it('setzt Ast-Tag über die Knoten seines Astes', () => {
    const L = skillLayout();
    for (const br of BRANCHES) {
      const tag = L.tags.find((t) => t.id === br.id);
      const own = L.nodes.filter((n) => n.def.br === br.id);
      expect(own.length).toBeGreaterThan(0);
      const top = Math.min(...own.map((n) => n.y));
      expect(tag.y).toBeLessThan(top);
      expect(top - tag.y).toBeLessThan(40);
      for (const n of own) expect((n.y - top) % 150).toBe(0);
    }
  });

  it('stapelt Knoten gleicher Tiefe untereinander statt übereinander', () => {
    const L = skillLayout();
    const col = (b) => Math.round((b.x - 20) / 280);
    const groups = new Map();
    for (const b of L.nodes) {
      const k = `${b.def.br}:${col(b)}`;
      (groups.get(k) || groups.set(k, []).get(k)).push(b);
    }
    const stacked = [...groups.values()].filter((g) => g.length > 1);
    expect(stacked.length).toBeGreaterThan(0);
    for (const g of stacked) {
      const ys = g.map((b) => b.y);
      expect(new Set(ys).size).toBe(ys.length);
    }
  });
});
