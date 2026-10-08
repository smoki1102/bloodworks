import { describe, it, expect, beforeEach } from 'vitest';
import { boot, put, run } from './helpers.js';
import { S } from '../src/core/state.js';
import { QUESTS } from '../src/config/quest-defs.js';
import { METRIC, questDef, questProgress, questStep, questTotal } from '../src/core/quests.js';
import { upgCount } from '../src/core/upgrades.js';
import { feed } from '../src/core/belts.js';

describe('Auftragskette', () => {
  beforeEach(() => boot());

  it('führt für jede Quest eine existierende Metrik', () => {
    for (const q of QUESTS) expect(METRIC[q.metric], `Metrik ${q.metric}`).toBeTruthy();
  });

  it('hat sinnvolle Ziele und Belohnungen', () => {
    for (const q of QUESTS) {
      expect(q.goal).toBeGreaterThan(0);
      expect(q.reward).toBeGreaterThan(0);
      expect(q.n.length).toBeGreaterThan(0);
      expect(q.d.length).toBeGreaterThan(0);
    }
    expect(questTotal()).toBe(QUESTS.length);
  });

  it('zählt Abschleuderer-Würfe als Ereignis, nicht als Gebäude', () => {
    put('schleuder', 13, 20, { dir: 0 });
    run(1);
    expect(S.stats.schleuder).toBe(0);
    const b = put('schleuder', 10, 20, { dir: 0 });
    b.items.push({ kind: 'stick', p: 0.5, lat: 0, body: null, chair: false, held: true });
    run(0.5);
    expect(S.stats.schleuder).toBe(1);
    expect(S.stats.ejected).toBe(1);
  });

  it('zählt verkaufte Körperteile an der Verkaufsstelle', () => {
    S.skill.lv.eco_shop = 1;
    const shop = put('shop', 10, 20);
    shop.items.push({ kind: 'limb', part: 'head', p: 0, lat: 0, bleed: 0, life: 120 });
    run(1.5);
    expect(S.stats.partsSold).toBe(1);
  });

  it('schreitet die Kette nur mit erreichtem Ziel fort', () => {
    expect(questDef().metric).toBe('kills');
    expect(questStep()).toBeNull();
    const before = S.money;
    S.stats.kills = 10;
    const q = questStep();
    expect(q).toBeTruthy();
    expect(S.quest).toBe(1);
    expect(S.money).toBe(before + q.reward);
    expect(questProgress()).toBe(0);
  });

  it('erlaubt keinen Rückschritt und endet nach der letzten Quest', () => {
    S.quest = QUESTS.length - 1;
    const last = questDef();
    S.stats[last.metric] = last.goal;
    expect(questStep()).toBe(last);
    expect(questDef()).toBeNull();
    expect(questStep()).toBeNull();
    expect(questProgress()).toBe(0);
  });

  it('upg-Metrik zählt gekaufte Upgrades', () => {
    expect(upgCount()).toBe(0);
    S.blood = 100;
    S.quest = 6;
    expect(questProgress()).toBe(0);
  });
});
