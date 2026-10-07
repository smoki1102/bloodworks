import { BASE_CAP, GRID_H, GRID_W, SPAWN_FIRST, START_MONEY } from '../config/constants.js';

export let S,
  blds,
  occ,
  bmap,
  nextId,
  sticks,
  corpses,
  parts,
  beltBlood,
  floorBlood,
  nets;

/** Effekt-Standard des Skill-Trees; `buySkill` rechnet sie neu. */
export function defaultFx() {
  return {
    hit: 0,
    multi: 0,
    machSpeed: 1,
    machDmg: 1,
    machDirt: 1,
    machEnergy: 1,
    pipeFlow: 1,
    tankCap: 0,
    pipeLoss: 1,
    beltSpeed: 1,
    routeCap: 0,
    price: 1,
    buildCost: 1,
    cleanCost: 1,
    gen: 1,
    oven: 1,
  };
}

export function freshState() {
  return {
    money: START_MONEY,
    energy: 120,
    energyMax: 200,
    blood: 0,
    bloodCap: BASE_CAP,
    ash: 0,
    t: 0,
    running: false,
    speed: 1,
    pf: 1,
    cat: 'band',
    tool: null,
    dir: 0,
    span: 3,
    sel: null,
    spawnTimer: SPAWN_FIRST,
    spawned: 0,
    netDirty: false,
    kills: 0,
    sold: 0,
    escaped: 0,
    ejected: 0,
    caught: 0,
    toggled: 0,
    quest: 0,
    up: { lv: {} },
    skill: { lv: {} },
    fx: defaultFx(),
    parts: { head: 0, torso: 0, armL: 0, armR: 0, legL: 0, legR: 0 },
    gore: 100,
    done: true,
    tut: 'off',
    tutStep: 0,
    tutCells: [],
    tutItem: null,
    gift: false,
    skillSeen: false,
    cam: { x: 0, y: 0, z: 1 },
    mx: 0,
    my: 0,
    wx: 0,
    wy: 0,
    down: false,
    pan: null,
    reduce: false,
    staleSave: 0,
  };
}

export function initSim() {
  blds = [];
  bmap = new Map();
  nextId = 1;
  occ = new Int32Array(GRID_W * GRID_H);
  sticks = [];
  corpses = [];
  parts = [];
  nets = [];
  beltBlood = new Float32Array(GRID_W * GRID_H);
  floorBlood = new Float32Array(GRID_W * GRID_H);
}

export function setState(next) {
  S = next;
}

export function takeId() {
  return nextId++;
}
