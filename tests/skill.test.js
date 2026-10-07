import { describe, it, expect, beforeEach } from 'vitest';
import { boot, put } from './helpers.js';
import { S } from '../src/core/state.js';
import {
  buySkill,
  branchOf,
  skillCost,
  skillDef,
  skillLv,
  skillReady,
  spentIn,
  giveSkillGift,
  recomputeFx,
} from '../src/core/skill.js';
import { giveParts, partPoints, spendParts } from '../src/core/parts.js';
import { isUnlocked, costOf } from '../src/core/placement.js';
import { beltSpeed } from '../src/core/belts.js';
import { TUTORIAL_GIFT, BRANCHES, SKILL } from '../src/config/skill-defs.js';

describe('Skill-Tree', () => {
  beforeEach(() => boot());

  it('kauft Blutknoten und zieht die Kosten ab', () => {
    const n = skillDef('prec_aim');
    expect(skillCost(n)).toBe(40);
    S.blood = 50;
    expect(buySkill('prec_aim')).toBe(true);
    expect(skillLv('prec_aim')).toBe(1);
    expect(S.blood).toBe(10);
    expect(S.fx.hit).toBeCloseTo(0.12, 5);
    expect(skillCost(n)).toBe(90);
  });

  it('verweigert Kauf ohne Budget und ohne Voraussetzung', () => {
    S.blood = 10;
    expect(buySkill('prec_aim')).toBeFalsy();
    expect(skillLv('prec_aim')).toBe(0);
    S.blood = 500;
    expect(buySkill('prec_blade')).toBeFalsy();
    expect(skillLv('prec_blade')).toBe(0);
    expect(buySkill('prec_aim')).toBe(true);
    expect(buySkill('prec_blade')).toBe(true);
    expect(skillLv('prec_blade')).toBe(1);
    expect(S.blood).toBe(500 - 40 - 120);
  });

  it('zahlt Maschinenknoten aus dem Körperteil-Vorrat', () => {
    const points0 = partPoints();
    expect(buySkill('mach_speed')).toBeFalsy();
    giveParts({ armL: 30 });
    expect(buySkill('mach_speed')).toBe(true);
    expect(skillLv('mach_speed')).toBe(1);
    expect(partPoints()).toBeLessThan(points0 + 60);
    expect(S.fx.machSpeed).toBeCloseTo(1.08, 5);
  });

  it('verbraucht Teile vom billigsten Ende', () => {
    S.parts.armL = 1;
    S.parts.head = 1;
    expect(spendParts(10)).toBe(false);
    S.parts.legL = 1;
    expect(spendParts(5)).toBe(true);
    expect(S.parts.armL).toBe(0);
    expect(S.parts.legL).toBe(0);
    expect(S.parts.head).toBe(1);
  });

  it('rechnet Effekte neu und wirkt auf gebaute Bänder', () => {
    const belt = put('belt', 5, 5, { dir: 0 });
    const before = beltSpeed();
    expect(belt).toBeTruthy();
    giveParts({ legR: 40 });
    expect(buySkill('log_speed')).toBe(true);
    expect(S.fx.beltSpeed).toBeCloseTo(1.08, 5);
    expect(beltSpeed()).toBeGreaterThan(before);
    S.skill.lv.log_speed = 3;
    recomputeFx();
    expect(S.fx.beltSpeed).toBeCloseTo(Math.pow(1.08, 3), 5);
    S.skill.lv = {};
    recomputeFx();
    expect(S.fx.beltSpeed).toBe(1);
  });

  it('schaltet Bauvorrichtungen über Knoten frei', () => {
    expect(isUnlocked('blade')).toBe(false);
    S.blood = 200;
    expect(buySkill('prec_aim')).toBe(true);
    expect(buySkill('prec_blade')).toBe(true);
    expect(isUnlocked('blade')).toBe(true);
    expect(isUnlocked('shop')).toBe(false);
    giveParts({ legR: 100 });
    expect(buySkill('eco_price')).toBe(true);
    expect(buySkill('eco_price')).toBe(true);
    expect(buySkill('eco_shop')).toBe(true);
    expect(isUnlocked('shop')).toBe(true);
    expect(costOf('shop')).toBeGreaterThan(0);
  });

  it('gibt das Tutorial-Geschenk nur einmal', () => {
    expect(S.gift).toBe(false);
    giveSkillGift();
    expect(S.gift).toBe(true);
    expect(S.blood).toBe(TUTORIAL_GIFT.blood);
    giveSkillGift();
    expect(S.blood).toBe(TUTORIAL_GIFT.blood);
  });

  it('führt die Daten der Äste konsistent', () => {
    for (const br of BRANCHES) {
      const nodes = branchOf(br.id);
      expect(nodes.length).toBeGreaterThan(0);
      expect(spentIn(br.id)).toBe(0);
      for (const n of nodes) expect(n.br).toBe(br.id);
    }
    for (const n of SKILL) {
      expect(skillDef(n.id)).toBe(n);
      expect(skillReady(n)).toBe(n.req.every(([id, lv]) => skillLv(id) >= lv));
    }
    const filter = skillDef('log_filter');
    expect(filter.req).toEqual([['log_route', 1]]);
  });
});
