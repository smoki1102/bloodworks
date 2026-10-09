import { S } from './state.js';

/**
 * Gleitende Kennzahlen für das Statistik-Dashboard. Aufsummierte Zähler aus
 * `S.stats` werden als Momentaufnahmen über ein Zeitfenster gehalten, sodass
 * sich Raten pro Minute ergeben (spielzeit-basiert, respektiert Pause/Tempo).
 */
const WINDOW = 60;
const STEP = 1;
const PER_MIN = 60;
let samples = [];

const snap = () => ({
  t: S.t,
  kills: S.stats.kills,
  caught: S.stats.caught,
  sold: S.stats.sold,
  ejected: S.stats.ejected,
  escaped: S.stats.escaped,
  partsSold: S.stats.partsSold,
  money: S.money,
});

/** Wird jeden Simulationsschritt aufgerufen; legt höchstens 1 Probe/Sekunde an. */
export function stepRates() {
  const last = samples[samples.length - 1];
  if (!last || S.t - last.t >= STEP) samples.push(snap());
  while (samples.length > 2 && S.t - samples[0].t > WINDOW) samples.shift();
}

export function resetRates() {
  samples = [];
}

/** Durchschnitt pro Minute über das Beobachtungsfenster (0 mit < 2 Proben). */
export function ratePerMin(key) {
  if (samples.length < 2) return 0;
  const a = samples[0],
    b = samples[samples.length - 1];
  const dt = b.t - a.t;
  if (dt <= 0) return 0;
  return ((b[key] - a[key]) / dt) * PER_MIN;
}

export const rateWindow = () =>
  samples.length < 2 ? 0 : samples[samples.length - 1].t - samples[0].t;
