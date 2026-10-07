import { BASE_CAP, COLS, SPAWN_FIRST } from '../config/constants.js';

export let S, blds, occ, nextId, sticks, corpses, parts, beltBlood, floorBlood;

export function freshState() {
  return {
    money: 1200,
    energy: 120,
    energyMax: 200,
    blood: 0,
    bloodCap: BASE_CAP,
    ash: 0,
    t: 0,
    running: false,
    speed: 1,
    pf: 1,
    cat: 'halle',
    tool: null,
    sel: null,
    spawnTimer: SPAWN_FIRST,
    kills: 0,
    sold: 0,
    escaped: 0,
    ejected: 0,
    caught: 0,
    toggled: 0,
    quest: 0,
    up: { lv: {} },
    gore: 100,
    done: false,
    tutStep: 0,
    mx: 0,
    my: 0,
    down: false,
  };
}
export function initSim() {
  blds = [];
  nextId = 1;
  occ = {
    belt: new Int32Array(COLS),
    over: new Int32Array(COLS),
    keller: new Int32Array(COLS),
    oben: new Int32Array(COLS),
  };
  sticks = [];
  corpses = [];
  parts = [];
  beltBlood = new Float32Array(COLS);
  floorBlood = new Float32Array(COLS);
}

export function setState(next) {
  S = next;
}

export function takeId() {
  return nextId++;
}
