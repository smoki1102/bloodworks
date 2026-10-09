/**
 * Leichte Zeitmessung für die Spielschleife.
 *
 * Alles ist aus, bis `setPerf(true)` (URL `?perf` bzw. `?bench`, siehe
 * `main.js`) es einschaltet – ausgeschalteter Zustand kostet je Aufruf nur
 * einen Booleschen Vergleich. Eingeschaltet sammelt das Modul Summe, Anzahl
 * und Maximum je Mark und meldet alle `REPORT_MS` ein Konsolen-Protokoll
 * (`[perf] …`), das auch über CDP ausgelesen werden kann
 * (`scripts/profile.mjs`).
 */

const REPORT_MS = 2500;

const now = () =>
  typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();

/** name -> {sum, n, max} */
const marks = new Map();
/** offene Messungen (Verschachtelung: render > render.bg) */
const stack = [];
let enabled = false;
let frameT0 = 0;
let winT0 = 0;
let lastReport = 0;

function slot(name) {
  let s = marks.get(name);
  if (!s) marks.set(name, (s = { sum: 0, n: 0, max: 0 }));
  return s;
}

export function setPerf(on) {
  enabled = !!on;
  if (enabled) resetPerf();
}

export const perfOn = () => enabled;

export function resetPerf() {
  marks.clear();
  stack.length = 0;
  frameT0 = 0;
  winT0 = 0;
  lastReport = now();
}

export function perfBegin(name) {
  if (!enabled) return;
  stack.push(name, now());
}

export function perfEnd(name) {
  if (!enabled) return;
  const t = now();
  const i = stack.lastIndexOf(name);
  if (i < 0 || i % 2) return; // kein passendes Beginn (z. B. erst eingeschaltet)
  const dt = t - stack[i + 1];
  stack.splice(i, 2);
  const s = slot(name);
  s.sum += dt;
  s.n++;
  if (dt > s.max) s.max = dt;
}

/** Ereignisse zählen (Ticks pro Frame, erzeugte Objekte …). */
export function perfCount(name, n = 1) {
  if (!enabled) return;
  const s = slot(name);
  s.count = true;
  s.sum += n;
  s.n++;
  if (n > s.max) s.max = n;
}

/**
 * Frame-Anfang: misst die reale Frame-Dauer (`_ts` ist nur der
 * Spielzeitstempel – die Bench-Treiberschleife liefert synthetische
 * Werte, gemessen wird trotzdem echt) und meldet periodisch.
 */
export function perfFrame(_ts) {
  if (!enabled) return;
  const t = now();
  if (!frameT0) {
    frameT0 = t;
    winT0 = t;
    lastReport = t;
    return;
  }
  const s = slot('frame');
  const dt = t - frameT0;
  frameT0 = t;
  s.sum += dt;
  s.n++;
  if (dt > s.max) s.max = dt;
  if (t - lastReport >= REPORT_MS) {
    lastReport = t;
    report((t - winT0) / 1000);
    winT0 = t;
  }
}

/** Aktuelles Fenster als sortierte Liste (für Tests und CDP-Auswertung). */
export function perfSnapshot() {
  const total = marks.get('frame')?.sum || 0;
  const out = [];
  for (const [name, s] of marks) {
    const count = !!s.count;
    out.push({
      name,
      count,
      n: s.n,
      sum: +s.sum.toFixed(2),
      avg: +(s.sum / Math.max(1, s.n)).toFixed(3),
      max: +s.max.toFixed(2),
      pct: !count && total > 0 && name !== 'frame' ? +((100 * s.sum) / total).toFixed(1) : 0,
    });
  }
  out.sort((a, b) => b.sum - a.sum);
  return { frames: marks.get('frame')?.n || 0, total: +total.toFixed(1), marks: out };
}

function report(seconds) {
  const snap = perfSnapshot();
  if (!snap.frames) return;
  const fps = (snap.frames / Math.max(0.001, seconds)).toFixed(1);
  const line = snap.marks
    .filter((m) => m.name !== 'frame')
    .map((m) => (m.count ? `${m.name} ${m.avg.toFixed(2)}/F` : `${m.name} ${m.avg.toFixed(2)}ms(${m.pct}%)`))
    .join('  ');
  console.log(
    `[perf] ${snap.frames} Frames in ${seconds.toFixed(1)}s = ${fps} fps · ` +
      `Frame ${((snap.total / snap.frames) || 0).toFixed(2)}ms · ${line}`,
  );
}

/** Wird von `main.js` in den Modus `?perf`/`?bench` auf `globalThis` gelegt. */
export function installPerfHook() {
  globalThis.__bwPerf = { snapshot: perfSnapshot, reset: resetPerf, set: setPerf };
  return globalThis.__bwPerf;
}
