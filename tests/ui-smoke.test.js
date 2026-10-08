import { describe, it, expect } from 'vitest';
import { frames, el, fireDoc, fireWin } from './dom-stub.js';
import '../src/main.js';
import { S, blds, corpses, sticks } from '../src/core/state.js';
import { CELL } from '../src/config/constants.js';
import { costOf } from '../src/core/placement.js';
import { save, load, hasSave, newGame, toggleRun, renderInspector } from '../src/ui/ui.js';
import { addBuilding } from '../src/core/placement.js';
import { rebuildNets } from '../src/core/pipes.js';

const step = (n) => frames(n);
/** Ziel mit `data`-Attributen, das `closest()` wie im Browser beantwortet. */
const fake = (data = {}) => ({
  dataset: { ...data },
  closest(sel) {
    const m = sel.match(/^\[data-([\w-]+)(?:="([^"]*)")?\]$/);
    if (m) {
      const v = this.dataset[m[1]];
      if (v === undefined) return null;
      return m[2] === undefined || m[2] === v ? this : null;
    }
    if (sel === '.card') return this.dataset.t === undefined ? null : this;
    return null;
  },
});
const toScreen = (wx, wy) => ({
  clientX: (wx - S.cam.x) * S.cam.z + 640,
  clientY: (wy - S.cam.y) * S.cam.z + 360,
});

describe('UI im DOM (Smoke)', () => {
  it('lädt ohne fehlende Elemente und rendert Frames', () => {
    expect(el('cv')).toBeTruthy();
    expect(el('btnPlay')).toBeTruthy();
    expect(el('btnResearch')).toBeTruthy();
    expect(el('forschung')).toBeTruthy();
    expect(el('fNet')).toBeTruthy();
    expect(el('hint')).toBeTruthy();
    expect(el('rParts')).toBeTruthy();
    expect(el('rParts').textContent).toMatch(/^\d+$/);
    expect(el('btnSkipTut').hidden).toBe(true);
    step(5);
    expect(S.running).toBe(false);
    expect(S.t).toBe(0);
  });

  it('baut die Startwelt, simuliert und platziert über Karte + Canvas', () => {
    el('btnFree').click();
    expect(S.tut).toBe('off');
    expect(blds.length).toBe(7);
    el('btnPlay').click();
    expect(S.running).toBe(true);
    step(600);
    expect(S.t).toBeGreaterThan(5);
    expect(S.spawned).toBeGreaterThan(0);
    step(1500);
    expect(S.ash).toBeGreaterThan(0);

    const money0 = S.money;
    fireDoc('click', { target: fake({ t: 'spike' }) });
    expect(S.tool).toBe('spike');
    const p = toScreen(60 * CELL + CELL / 2, 50 * CELL + CELL / 2);
    el('cv').dispatch('pointerdown', { button: 0, clientX: p.clientX, clientY: p.clientY, pointerId: 1 });
    const spike = blds.find((b) => b.t === 'spike');
    expect(spike).toBeTruthy();
    expect(spike.x).toBe(60);
    expect(spike.y).toBe(50);
    expect(S.money).toBe(money0 - costOf('spike'));
    expect(S.sel).toBe(spike);
    fireWin('pointerup', { target: el('cv') });
    toggleRun();
    expect(S.running).toBe(false);
    expect(corpses.length + sticks.length).toBeGreaterThanOrEqual(0);
  });

  it('baut eine Förderband-Strecke mit zwei Klicks', () => {
    const money0 = S.money;
    fireDoc('click', { target: fake({ t: 'belt' }) });
    expect(S.tool).toBe('belt');
    const at = (x, y) => toScreen(x * CELL + CELL / 2, y * CELL + CELL / 2);
    const a = at(30, 40);
    el('cv').dispatch('pointerdown', { button: 0, clientX: a.clientX, clientY: a.clientY, pointerId: 1 });
    fireWin('pointerup', { target: el('cv') });
    expect(S.beltFrom).toEqual({ x: 30, y: 40 });
    step(2);
    const b = at(33, 40);
    el('cv').dispatch('pointerdown', { button: 0, clientX: b.clientX, clientY: b.clientY, pointerId: 2 });
    fireWin('pointerup', { target: el('cv') });
    expect(S.beltFrom).toBeNull();
    const built = blds.filter((x) => x.t === 'belt' && x.y === 40 && x.x >= 30 && x.x <= 33);
    expect(built.length).toBe(4);
    expect(S.money).toBe(money0 - 4 * costOf('belt'));
    step(2);
    fireDoc('click', { target: fake({ t: 'belt' }) });
    expect(S.tool).toBeNull();
  });

  it('baut eine diagonale Strecke mit zwei Klicks', () => {
    const money0 = S.money;
    fireDoc('click', { target: fake({ t: 'belt' }) });
    expect(S.tool).toBe('belt');
    const at = (x, y) => toScreen(x * CELL + CELL / 2, y * CELL + CELL / 2);
    const a = at(30, 44);
    el('cv').dispatch('pointerdown', { button: 0, clientX: a.clientX, clientY: a.clientY, pointerId: 3 });
    fireWin('pointerup', { target: el('cv') });
    expect(S.beltFrom).toEqual({ x: 30, y: 44 });
    step(2);
    const b = at(32, 46);
    el('cv').dispatch('pointerdown', { button: 0, clientX: b.clientX, clientY: b.clientY, pointerId: 4 });
    fireWin('pointerup', { target: el('cv') });
    expect(S.beltFrom).toBeNull();
    const built = blds.filter((x) => x.t === 'belt' && x.x >= 30 && x.x <= 32 && x.y >= 44 && x.y <= 46);
    expect(built.length).toBe(3);
    expect(built.every((x) => x.dir === 5)).toBe(true);
    expect(S.money).toBe(money0 - 3 * costOf('belt'));
    step(2);
    fireDoc('click', { target: fake({ t: 'belt' }) });
    expect(S.tool).toBeNull();
  });

  it('Kategorien, Werkzeuge und Kamera reagieren auf Eingaben', () => {
    fireWin('keydown', { code: 'Digit2', key: '2', preventDefault() {} });
    expect(S.cat).toBe('masch');
    fireWin('keydown', { code: 'Digit1', key: '1', preventDefault() {} });
    expect(S.cat).toBe('band');
    el('cv').dispatch('pointerdown', { button: 0, clientX: 10, clientY: 10, pointerId: 1 });
    expect(S.down).toBe(true);
    fireWin('pointerup', { target: el('cv') });
    expect(S.down).toBe(false);
    const z0 = S.cam.z;
    el('cv').dispatch('wheel', { deltaY: -100, clientX: 100, clientY: 100 });
    expect(S.cam.z).toBeGreaterThan(z0);
    fireWin('keydown', { code: 'ArrowLeft', key: 'ArrowLeft', preventDefault() {} });
    step(3);
  });

  it('speichert und lädt den Speicherstand v9', () => {
    const before = { n: blds.length, money: S.money, t: S.t, spike: !!blds.find((b) => b.t === 'spike') };
    save(true);
    expect(hasSave()).toBe(true);
    newGame('free');
    expect(S.t).toBe(0);
    expect(blds.length).toBe(7);
    expect(load()).toBe(true);
    expect(S.t).toBe(before.t);
    expect(blds.length).toBe(before.n);
    expect(S.money).toBe(before.money);
    expect(!!blds.find((b) => b.t === 'spike')).toBe(before.spike);
    localStorage.setItem('bloodworks_v9', JSON.stringify({ v: 8 }));
    expect(hasSave()).toBe(false);
    expect(load()).toBeFalsy();
    localStorage.removeItem('bloodworks_v9');
    expect(hasSave()).toBe(false);
  });

  it('Startmenü und das große Forschungsfenster lassen sich öffnen', () => {
    el('btnNew').click();
    expect(el('modal').classList.contains('hide')).toBe(false);
    el('btnStart').click();
    expect(S.tut).toBe('on');
    expect(el('modal').classList.contains('hide')).toBe(true);
    expect(el('btnSkipTut').hidden).toBe(false);
    step(3);
    fireDoc('click', { target: fake({ a: 'openForschung' }) });
    expect(el('forschung').classList.contains('hide')).toBe(false);
    expect(el('fNet').classList.contains('hide')).toBe(false);
    expect(el('fUpg').classList.contains('hide')).toBe(true);
    expect(el('fBlood').textContent).toMatch(/^\d/);
    fireDoc('click', { target: fake({ ftab: 'upg' }) });
    expect(el('fUpg').classList.contains('hide')).toBe(false);
    expect(el('fNet').classList.contains('hide')).toBe(true);
    fireDoc('click', { target: fake({ a: 'closeForschung' }) });
    expect(el('forschung').classList.contains('hide')).toBe(true);
    step(3);
    el('btnSave').click();
    expect(hasSave()).toBe(true);
    el('btnSkipTut').click();
    expect(S.tut).toBe('off');
    expect(S.done).toBe(true);
    expect(el('btnSkipTut').hidden).toBe(true);
    expect(el('hint').style.display).toBe('none');
  });

  it('Forschung pausiert das Spiel, solange das Fenster offen ist', () => {
    el('btnFree').click();
    el('btnPlay').click();
    expect(S.running).toBe(true);
    fireDoc('click', { target: fake({ a: 'openForschung' }) });
    expect(el('forschung').classList.contains('hide')).toBe(false);
    expect(S.running).toBe(false);
    fireDoc('click', { target: fake({ a: 'closeForschung' }) });
    expect(el('forschung').classList.contains('hide')).toBe(true);
    expect(S.running).toBe(true);
    toggleRun();
    expect(S.running).toBe(false);
  });

  it('Inspektor zeigt eine angeschlossene Absaugung und hält die Zielauswahl', () => {
    addBuilding('tank', 44, 18, { free: true });
    addBuilding('pipe', 43, 18, { free: true });
    const belt = addBuilding('belt', 42, 18, { free: true, dir: 0 });
    addBuilding('spike', 40, 18, { free: true });
    rebuildNets();
    S.sel = belt;
    renderInspector();
    expect(el('inspector').innerHTML).toContain('Absaugung');
    const cut = blds.find((b) => b.t === 'spike');
    S.sel = cut;
    renderInspector();
    expect(el('inspector').innerHTML).toContain('Zielkörperteil');
    S.sel = null;
    renderInspector();
  });
});
