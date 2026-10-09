import { describe, it, expect } from 'vitest';
import { frames, el, fireDoc, fireWin } from './dom-stub.js';
import '../src/main.js';
import { FIXED_DT } from '../src/main.js';
import { S, blds, corpses, sticks } from '../src/core/state.js';
import { CELL } from '../src/config/constants.js';
import { setReducedMotion } from '../src/core/effects.js';
import { costOf } from '../src/core/placement.js';
import { save, load, hasSave, newGame, toggleRun, renderInspector } from '../src/ui/ui.js';
import { addBuilding } from '../src/core/placement.js';
import { rebuildNets } from '../src/core/pipes.js';
import { DEF } from '../src/config/building-defs.js';
import { entryDirOf } from '../src/core/belts.js';

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

  it('rendert jeden Gebäudetyp auf dem neuen Footprint ohne Fehler', () => {
    newGame('free');
    S.money = 999999;
    S.skill.lv = { eco_shop: 1, prec_blade: 1, log_filter: 1 };
    Object.keys(DEF).forEach((t, i) => {
      const x = 2 + (i % 12) * 10;
      const y = 2 + Math.floor(i / 12) * 8;
      addBuilding(t, x, y, { free: true, dir: 0 });
    });
    rebuildNets();
    step(3);
    expect(blds.length).toBeGreaterThanOrEqual(Object.keys(DEF).length);
    setReducedMotion(true);
    step(2);
    setReducedMotion(false);
    step(1);
    S.sel = blds.find((b) => b.t === 'spike');
    renderInspector();
    expect(el('inspector').innerHTML).toContain('Spikes');
    S.sel = null;
    step(1);
  });

  it(
    'baut die Startwelt, simuliert und platziert über Karte + Canvas',
    () => {
      el('btnFree').click();
      expect(S.tut).toBe('off');
      expect(blds.length).toBe(7);
      el('btnPlay').click();
      expect(S.running).toBe(true);
      step(600);
      expect(S.t).toBeGreaterThan(5);
      expect(S.stats.spawned).toBeGreaterThan(0);
      step(1500);
      expect(S.ash).toBeGreaterThan(0);

      const money0 = S.money;
      fireDoc('click', { target: fake({ t: 'spike' }) });
      expect(S.tool).toBe('spike');
      const p = toScreen(60 * CELL + CELL / 2, 50 * CELL + CELL / 2);
      el('cv').dispatch('pointerdown', {
        button: 0,
        clientX: p.clientX,
        clientY: p.clientY,
        pointerId: 1,
      });
      const spike = blds.find((b) => b.t === 'spike');
      expect(spike).toBeTruthy();
      expect(spike.x).toBe(59);
      expect(spike.y).toBe(50);
      expect(S.money).toBe(money0 - costOf('spike'));
      expect(S.sel).toBe(spike);
      fireWin('pointerup', { target: el('cv') });
      toggleRun();
      expect(S.running).toBe(false);
      expect(corpses.length + sticks.length).toBeGreaterThanOrEqual(0);
    },
    20000,
  );

  it('integriert Spielzeit in festen 1/30-s-Schritten (Fixed Timestep)', () => {
    newGame('free');
    S.running = true;
    const before = S.t;
    frames(30, 16.7); // ≈ 0,501 s Spielzeit bei 1×
    const elapsed1 = S.t - before;
    expect(elapsed1).toBeGreaterThan(0.47);
    expect(elapsed1).toBeLessThanOrEqual(0.501 + FIXED_DT);
    S.speed = 4;
    const before2 = S.t;
    frames(5, 16.7); // ≈ 0,334 s Spielzeit bei 4×
    const elapsed4 = S.t - before2;
    expect(elapsed4).toBeGreaterThan(0.334 - FIXED_DT);
    expect(elapsed4).toBeLessThanOrEqual(0.334 + FIXED_DT);
    toggleRun();
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

  it('kopiert einen markierten Bereich und fügt ihn wieder ein (Strg+V)', () => {
    newGame('free');
    addBuilding('belt', 30, 40, { free: true, dir: 0 });
    addBuilding('spike', 31, 40, { free: true, dir: 0 });
    const at = (x, y) => toScreen(x * CELL + CELL / 2, y * CELL + CELL / 2);
    const a = at(30, 40),
      b = at(31, 40);
    el('cv').dispatch('pointerdown', {
      button: 0,
      shiftKey: true,
      clientX: a.clientX,
      clientY: a.clientY,
      pointerId: 10,
    });
    el('cv').dispatch('pointermove', { clientX: b.clientX, clientY: b.clientY, pointerId: 10 });
    fireWin('pointerup', { target: el('cv') });
    expect(S.select).toBeNull();
    expect(S.bp).toBeTruthy();
    expect(S.bp.cells).toHaveLength(2);
    fireWin('keydown', { key: 'v', ctrlKey: true, preventDefault() {} });
    expect(S.paste).toBeTruthy();
    const money0 = S.money;
    const c = at(40, 40);
    el('cv').dispatch('pointerdown', {
      button: 0,
      clientX: c.clientX,
      clientY: c.clientY,
      pointerId: 11,
    });
    fireWin('pointerup', { target: el('cv') });
    expect(S.paste).toBeNull();
    expect(blds.find((x) => x.t === 'belt' && x.x === 40 && x.y === 40)).toBeTruthy();
    expect(blds.find((x) => x.t === 'spike' && x.x === 41 && x.y === 40)).toBeTruthy();
    expect(S.money).toBe(money0 - (costOf('belt') + costOf('spike')));
  });

  it('Kategorien, Werkzeuge und Kamera reagieren auf Eingaben', () => {    fireWin('keydown', { code: 'Digit2', key: '2', preventDefault() {} });
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

  it('speichert und lädt den Speicherstand v12', () => {
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

  it('erhält die Eckenrichtung (fromDir) über Speichern/Laden (v12)', () => {
    newGame('free');
    const b = addBuilding('belt', 10, 2, { dir: 0 });
    b.fromDir = 2;
    expect(entryDirOf(b)).toBe(2);
    save(true);
    newGame('free');
    expect(load()).toBe(true);
    const r = blds.find((x) => x.t === 'belt' && x.x === 10 && x.y === 2);
    expect(r).toBeTruthy();
    expect(r.fromDir).toBe(2);
    expect(entryDirOf(r)).toBe(2);
  });

  it('migriert v11-Bänder auf fromDir (Ecke bzw. gerade)', () => {
    newGame('free');
    localStorage.setItem(
      'bloodworks_v9',
      JSON.stringify({
        v: 11,
        money: 0,
        energy: 200,
        blood: 0,
        ash: 0,
        t: 0,
        gore: 100,
        stats: { spawned: 0, kills: 0, sold: 0, escaped: 0, ejected: 0, caught: 0, toggled: 0 },
        quest: 0,
        up: { lv: {} },
        skill: { lv: {} },
        blds: [
          { t: 'belt', x: 10, y: 2, dir: 0, from: 2 },
          { t: 'belt', x: 11, y: 2, dir: 0 },
          { t: 'belt', x: 12, y: 2, dir: 0, fromDir: 3 },
        ],
      }),
    );
    expect(hasSave()).toBe(true);
    expect(load()).toBe(true);
    const at = (x) => blds.find((b) => b.x === x && b.y === 2 && b.t === 'belt');
    expect(at(10).fromDir).toBe(2);
    expect(at(11).fromDir).toBe(0);
    expect(at(12).fromDir).toBe(3);
    expect(entryDirOf(at(10))).toBe(2);
    localStorage.removeItem('bloodworks_v9');
  });

  it('migriert einen v9-Spielstand auf S.stats (v12)', () => {
    localStorage.setItem(
      'bloodworks_v9',
      JSON.stringify({
        v: 9,
        money: 500,
        energy: 100,
        blood: 10,
        ash: 2,
        t: 12,
        gore: 100,
        kills: 7,
        sold: 30,
        escaped: 1,
        ejected: 2,
        caught: 3,
        toggled: 4,
        quest: 2,
        up: { lv: {} },
        skill: { lv: {} },
        blds: [],
      }),
    );
    expect(hasSave()).toBe(true);
    expect(load()).toBe(true);
    expect(S.stats.kills).toBe(7);
    expect(S.stats.sold).toBe(30);
    expect(S.stats.escaped).toBe(1);
    expect(S.stats.ejected).toBe(2);
    expect(S.stats.caught).toBe(3);
    expect(S.stats.toggled).toBe(4);
    expect(S.stats.partsSold).toBe(0);
    expect(S.stats.schleuder).toBe(0);
    expect(S.quest).toBe(2);
    localStorage.removeItem('bloodworks_v9');
  });

  it('migriert einen v10-Spielstand und setzt die Fabrik zurück (v12)', () => {
    localStorage.setItem(
      'bloodworks_v9',
      JSON.stringify({
        v: 10,
        money: 777,
        energy: 100,
        blood: 10,
        ash: 2,
        t: 12,
        gore: 100,
        stats: {
          spawned: 0,
          kills: 7,
          sold: 30,
          escaped: 1,
          ejected: 2,
          caught: 3,
          toggled: 4,
          partsSold: 5,
          schleuder: 6,
        },
        quest: 2,
        up: { lv: {} },
        skill: { lv: {} },
        blds: [{ t: 'spike', x: 13, y: 20, dir: 0 }],
      }),
    );
    expect(hasSave()).toBe(true);
    expect(load()).toBe(true);
    expect(S.money).toBe(777);
    expect(S.stats.kills).toBe(7);
    expect(S.stats.partsSold).toBe(5);
    expect(blds.length).toBe(0);
    localStorage.removeItem('bloodworks_v9');
  });

  it('migriert einen v11-Spielstand und erhält Band-Ecken (v12)', () => {
    localStorage.setItem(
      'bloodworks_v9',
      JSON.stringify({
        v: 11,
        money: 321,
        energy: 100,
        blood: 10,
        ash: 2,
        t: 12,
        gore: 100,
        stats: {},
        quest: 0,
        up: { lv: {} },
        skill: { lv: {} },
        blds: [
          { t: 'belt', x: 30, y: 40, dir: 5 },
          { t: 'belt', x: 31, y: 41, dir: 0, from: 5 },
        ],
      }),
    );
    expect(hasSave()).toBe(true);
    expect(load()).toBe(true);
    const a = blds.find((b) => b.x === 30 && b.y === 40);
    const c = blds.find((b) => b.x === 31 && b.y === 41);
    expect(a.fromDir).toBe(5);
    expect(c.dir).toBe(0);
    expect(c.fromDir).toBe(5);
    localStorage.removeItem('bloodworks_v9');
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
    addBuilding('spike', 38, 18, { free: true });
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
