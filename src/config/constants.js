export const CELL = 48,
  COLS = 24,
  X0 = 64,
  PW = COLS * CELL,
  W = X0 * 2 + PW,
  H = 620;
export const BELT_Y = 392,
  BELT_H = 14,
  OBEN_FLOOR = 190,
  OBEN_TOP = 44,
  KELLER_TOP = 406,
  KELLER_FLOOR = 590;
export const BELT_SPEED = 54,
  BASE_CAP = 100,
  TANK_CAP = 250,
  BASE_REGEN = 4,
  SAVE_KEY = 'bloodworks_v6';

/* ------------------------------ Balance ------------------------------ */
/* Aufgabe 0: alle Regler an einem Ort statt verstreuter Magic Numbers. */
export const DIRT_TIME = 0.55; // passive Verschmutzung pro Sekunde (skaliert mit DEF.dirt)
export const CLEAN_COST_BASE = 15,
  CLEAN_COST_PER = 0.8,
  CLEAN_TIME = 2;

export const MARKET_PRICE = 1.4, // € je Blut
  MARKET_RATE = 9; // Blut/s je Markt
export const DRAIN_RATE = 34, // Blut/s aus dem Boden
  DRAIN_REACH = 1; // Spaltenradius um den Abfluss
export const BIN_ROT_TIME = 9, // Sekunden bis eine Leiche verrottet
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
export const LAB_CLEAN_RATE = 7; // Sauberkeit/s über alle Geräte
export const GEN_BLOOD = 8, // Blut/s pro Generator
  GEN_GAIN = 15; // Energie/s je Blut/s
export const PRESS_SPEED = 1.2, // Phasentempo
  PRESS_PERIOD = 1.4,
  PRESS_WINDOW = 0.5; // Taktfenster, in dem die Presse schlägt

export const SPAWN_FIRST = 3,
  SPAWN_BASE = 3.2,
  SPAWN_MIN = 1.4,
  SPAWN_RAMP = 150;
export const CORPSE_CAP = 60,
  CORPSE_LIFE = 120,
  CORPSE_FLOOR_LIFE = 90;

/* ------------------------------ Anatomie ------------------------------ */
export const MAX_HP = 100,
  HIT_WINDOW = 0.5, // Trefferabstand der Spikes-Walze
  SPIKE_HITS = 3, // Treffer bis der Stick zusammenbricht
  CRUSH_DMG = 60, // Direktschaden der Presse
  DRIP_TIME = 0.35, // Bluttropfen-Intervall verwundeter Sticks
  STAND_TIME = 0.42; // Aufstehen aus dem Stuhl
export const BLEED = { head: 26, torso: 14, armL: 9, armR: 9, legL: 11, legR: 11 };
export const CHAIRS = 3,
  RELEASE_TIME = 4.0, // Freigabe-Intervall der Warteschlange
  ENTER_SPEED = 78, // Gehgeschwindigkeit zum Stuhl
  SIT_SHUFFLE = 60; // Rutschen im Stuhl nach vorn

