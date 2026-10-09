/* Rasterwelt: alles steht auf Zellen, es gibt keine Stockwerke mehr. */
export const CELL = 48,
  GRID_W = 128,
  GRID_H = 64,
  PW = GRID_W * CELL,
  PH = GRID_H * CELL,
  W = PW,
  H = PH;

/* Richtungen als Zahlen. 0–3 orthogonal (im Uhrzeigersinn), 4–7 diagonal:
   4 = NO, 5 = SO, 6 = SW, 7 = NW. Diagonale entstehen nur aus dem Streckenbau. */
export const E = 0,
  S = 1,
  WDIR = 2,
  N = 3;
export const DX = [1, 0, -1, 0, 1, 1, -1, -1],
  DY = [0, 1, 0, -1, -1, 1, 1, -1];
export const opp = (d) => (d < 4 ? (d + 2) & 3 : ((d - 2) & 3) + 4);
export const rotL = (d) => (d + 3) & 3;
export const rotR = (d) => (d + 1) & 3;
export const isDiag = (d) => d > 3;
export const DIR_NAME = ['Rechts', 'Runter', 'Links', 'Hoch'];

/** Richtung aus dem Verschiebungsvektor (je −1, 0 oder 1). */
const DIR_LUT = [7, 2, 6, -1, 3, -1, 1, -1, 4, 0, 5, -1];
export const dirOf = (sx, sy) => DIR_LUT[(sx + 1) * 4 + (sy + 1)];

/** Orthogonale Anteile einer Richtung (diagonal: beide Achsen, sonst: sie selbst). */
export const compsOf = (d) => {
  const out = [];
  if (DX[d]) out.push(DX[d] > 0 ? E : WDIR);
  if (DY[d]) out.push(DY[d] > 0 ? S : N);
  return out;
};

export const BELT_H = 14, // sichtbare Banddicke in einer Zelle
  BELT_SPEED = 54,
  GRAVITY = 1500;

export const BASE_CAP = 100,
  TANK_CAP = 250,
  BASE_REGEN = 4,
  /* Schlüssel-Name ist historisch (v9); maßgeblich ist SAVE_VER + migrate(). */
  SAVE_KEY = 'bloodworks_v9',
  SAVE_VER = 12,
  START_MONEY = 1600;

/* ------------------------------ Balance ------------------------------ */
export const DIRT_TIME = 0.55;
export const CLEAN_COST_BASE = 15,
  CLEAN_COST_PER = 0.8,
  CLEAN_TIME = 2;

export const MARKET_PRICE = 1.4, // € je Blut
  MARKET_RATE = 9, // Blut/s je Markt
  MARKET_RESERVE = 40; // Standard-Reserve absolut
export const DRAIN_RATE = 34,
  DRAIN_REACH = 1,
  DRAIN_BUF = 30;
export const DIRT_IDLE = 0.25,
  DIRT_WORK = 2.4;
export const UTIL_TAU = 1.5;
export const BIN_ROT_TIME = 9,
  BIN_BLOOD = 22,
  BIN_ASH = 4,
  BIN_CAP = 9;
export const OVEN_TIME = 1.4,
  OVEN_ENERGY = 32,
  OVEN_ASH = 6,
  OVEN_CAP = 3;
export const ACID_TIME = 1.7,
  ACID_MONEY = 22,
  ACID_CAP = 3;
export const SHOP_TIME = 0.9, // Abwicklungszeit pro Ware
  SHOP_CAP = 6,
  SHOP_VALUE_MULT = 2; // multipliziert Warenwert×Preis (war 8 → ~248 €/s)
export const LAB_CLEAN_RATE = 7,
  LAB_RANGE = 10; // Reinigungsradius um das Labor (Zellen)
export const GEN_BLOOD = 8,
  GEN_GAIN = 15;
export const BLADE_TIME = 1.2; // Verweildauer der Presse mit Klingen
export const PRESS_SPEED = 1.2,
  PRESS_PERIOD = 1.4,
  PRESS_WINDOW = 0.5;

export const SPAWN_FIRST = 3,
  SPAWN_BASE = 3.6,
  SPAWN_MIN = 1.8,
  SPAWN_RAMP = 150;
export const SPAWN_GAP = 34;
export const CORPSE_CAP = 60,
  CORPSE_LIFE = 120,
  CORPSE_FLOOR_LIFE = 90;

/* ------------------------------ Anatomie ------------------------------ */
export const MAX_HP = 100,
  HIT_WINDOW = 0.5,
  SPIKE_HITS = 3,
  CRUSH_DMG = 60,
  DRIP_TIME = 0.35;
/** Lebenspunkte je Körperteil – reicht das aus, wird das Teil abgetrennt. */
export const PART_HP = { head: 45, torso: 70, armL: 35, armR: 35, legL: 40, legR: 40 };
export const BLEED = { head: 26, torso: 14, armL: 9, armR: 9, legL: 11, legR: 11 };
/** Warenwert je Körperteil – Basis der Körperteil-Währung. */
export const PART_VALUE = { head: 6, torso: 4, armL: 2, armR: 2, legL: 3, legR: 3 };
export const EJECT_KICK = 190,
  EJECT_LIFT = -110,
  EJECT_SPIN = 5.5,
  SCHLEUDER_KICK = 260;

/* ------------------------------ Rohre / Logistik ------------------------------ */
export const PIPE_FLOW = 26, // Blut/s je Netz (Basis, Skilltree verbessert)
  PIPE_INTAKE = 0.05, // Verlust beim Einspeisen ins Netz
  ROUTE_TIME = 0.25, // Verweildauer in Weiche/Filter/Zusammenführung
  ROUTE_CAP = 3;
export const FILTER_DEF = { by: 'part', val: 'head' };
export const TARGETS = [
  ['', 'Zufällig'],
  ['head', 'Kopf'],
  ['torso', 'Torso'],
  ['arms', 'Arme'],
  ['legs', 'Beine'],
];
