import { describe, it, expect } from 'vitest';
import { frames, el, fireDoc, fireWin } from './dom-stub.js';
import '../src/main.js';
import { S, blds, corpses, sticks } from '../src/core/state.js';
import { CELL } from '../src/config/constants.js';
import { costOf } from '../src/core/placement.js';
import { save, load, hasSave, newGame, toggleRun } from '../src/ui/ui.js';

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
    expect(el('btnSkill')).toBeTruthy();
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

  it('Startmenü, Skill-Panel und Forschung lassen sich öffnen', () => {
    el('btnNew').click();
    expect(el('modal').classList.contains('hide')).toBe(false);
    el('btnStart').click();
    expect(S.tut).toBe('on');
    expect(el('modal').classList.contains('hide')).toBe(true);
    expect(el('btnSkipTut').hidden).toBe(false);
    step(3);
    fireDoc('click', { target: fake({ a: 'skill' }) });
    expect(el('skill').classList.contains('hide')).toBe(false);
    fireDoc('click', { target: fake({ a: 'closeSkill' }) });
    expect(el('skill').classList.contains('hide')).toBe(true);
    fireDoc('click', { target: fake({ a: 'research' }) });
    expect(el('research').classList.contains('hide')).toBe(false);
    step(3);
    el('btnSave').click();
    expect(hasSave()).toBe(true);
    el('btnSkipTut').click();
    expect(S.tut).toBe('off');
    expect(S.done).toBe(true);
    expect(el('btnSkipTut').hidden).toBe(true);
    expect(el('hint').style.display).toBe('none');
  });

  it('Skill-Tree pausiert das Spiel, solange er offen ist', () => {
    el('btnFree').click();
    el('btnPlay').click();
    expect(S.running).toBe(true);
    fireDoc('click', { target: fake({ a: 'skill' }) });
    expect(el('skill').classList.contains('hide')).toBe(false);
    expect(S.running).toBe(false);
    fireDoc('click', { target: fake({ a: 'closeSkill' }) });
    expect(el('skill').classList.contains('hide')).toBe(true);
    expect(S.running).toBe(true);
    toggleRun();
    expect(S.running).toBe(false);
  });
});
