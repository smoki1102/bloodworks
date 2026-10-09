import { describe, it, expect, beforeEach } from 'vitest';
import { boot, put } from './helpers.js';
import { S, occ, blds } from '../src/core/state.js';
import {
  addBuilding,
  canPlace,
  costOf,
  isUnlocked,
  originOf,
  placeReason,
  redo,
  removeBuilding,
  sellBuilding,
  undo,
} from '../src/core/placement.js';
import { idx } from '../src/core/grid.js';

describe('Platzierung', () => {
  beforeEach(() => boot());

  it('trägt Zellen ein und gibt sie beim Entfernen frei', () => {
    const b = put('spike', 10, 20);
    expect(occ[idx(10, 20)]).toBe(b.id);
    expect(occ[idx(11, 20)]).toBe(b.id);
    removeBuilding(b);
    expect(occ[idx(10, 20)]).toBe(0);
    expect(occ[idx(11, 20)]).toBe(0);
    expect(blds.length).toBe(0);
  });

  it('zieht Baukosten ab und scheitert ohne Geld', () => {
    S.money = 50;
    expect(addBuilding('spike', 4, 4)).toBeNull();
    S.money = 500;
    const before = S.money;
    const b = addBuilding('spike', 4, 4);
    expect(b).not.toBeNull();
    expect(S.money).toBe(before - costOf('spike'));
  });

  it('blockiert belegte und externe Felder', () => {
    put('bin', 6, 6);
    expect(canPlace('press', 6, 6)).toBe(false);
    expect(canPlace('belt', -1, 0)).toBe(false);
    expect(placeReason('belt', 100, 100)).toBe('Außerhalb der Fabrik');
  });

  it('verbietet Band-Schleifen (Ping-Pong)', () => {
    put('belt', 5, 5, { dir: 0 });
    expect(placeReason('belt', 6, 5, 0)).toBeNull();
    expect(placeReason('belt', 6, 5, 2)).toBe('Schleifenbildung');
  });

  it('verbietet diagonale Band-Schleifen', () => {
    put('belt', 5, 5, { dir: 5 });
    expect(placeReason('belt', 6, 6, 5)).toBeNull();
    expect(placeReason('belt', 6, 6, 7)).toBe('Schleifenbildung');
  });

  it('zentriert große Gebäude auf die Zielzelle', () => {
    expect(originOf('bin', 10, 10)).toEqual({ x: 10, y: 10 });
    expect(originOf('spawn', 10, 10)).toEqual({ x: 10, y: 10 });
    expect(originOf('spike', 10, 10)).toEqual({ x: 9, y: 10 });
    expect(originOf('tank', 10, 10)).toEqual({ x: 10, y: 9 });
    expect(originOf('market', 10, 10)).toEqual({ x: 9, y: 9 });
  });

  it('Verkauf zahlt die Hälfte, Rückgängig stellt wieder her', () => {
    S.money = 1000;
    const b = addBuilding('tank', 20, 20);
    const afterBuy = S.money;
    sellBuilding(b);
    expect(S.money).toBeGreaterThan(afterBuy);
    expect(blds.length).toBe(0);
    undo();
    expect(blds.length).toBe(1);
    expect(S.money).toBe(afterBuy);
    expect(S.money).toBe(1000 - costOf('tank'));
  });

  it('stellt einen Verkauf wieder her und macht ihn erneut rückgängig (Redo)', () => {
    S.money = 1000;
    const b = addBuilding('tank', 20, 20);
    const afterBuy = S.money;
    sellBuilding(b);
    expect(blds.length).toBe(0);
    undo();
    expect(blds.length).toBe(1);
    expect(S.money).toBe(afterBuy);
    redo();
    expect(blds.length).toBe(0);
    expect(S.money).toBe(1000 - costOf('tank') + Math.round(costOf('tank') * 0.5));
  });

  it('stellt ein gebautes Gebäude per Redo erneut her', () => {
    S.money = 1000;
    addBuilding('spike', 10, 10);
    const cost = costOf('spike');
    expect(blds.length).toBe(1);
    undo();
    expect(blds.length).toBe(0);
    expect(S.money).toBe(1000);
    redo();
    expect(blds.length).toBe(1);
    expect(S.money).toBe(1000 - cost);
  });

  it('verwirft Redo, sobald eine neue Aktion beginnt', () => {
    S.money = 1000;
    addBuilding('spike', 10, 10);
    undo();
    addBuilding('spike', 12, 10);
    redo();
    expect(blds.length).toBe(1);
  });
});

describe('Freischaltungen', () => {
  beforeEach(() => boot());

  it('sperrt Verkauf und Klingenpresse bis zum Skill', () => {
    expect(isUnlocked('shop')).toBe(false);
    expect(isUnlocked('blade')).toBe(false);
    expect(isUnlocked('filter')).toBe(false);
    expect(isUnlocked('spike')).toBe(true);
    S.skill.lv = { eco_shop: 1, prec_blade: 1, log_filter: 1 };
    expect(isUnlocked('shop')).toBe(true);
    expect(isUnlocked('blade')).toBe(true);
    expect(isUnlocked('filter')).toBe(true);
  });
});
