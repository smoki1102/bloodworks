import { reducedMotion } from '../../core/effects.js';

/**
 * Reine Posen-Mathematik für Maschinenanimationen.
 *
 * Dieses Modul schreibt **keinen** Zustand und kennt kein Canvas – es bildet
 * nur Zeit (und optional den Warenfortschritt) auf Winkel/Hübe ab. Die
 * Maschinen-Module in `render/machines/` rufen `pose()` auf und zeichnen damit.
 * Dadurch sind die Animationen ohne DOM testbar (Struktur, Periodizität).
 */

export const TAU = Math.PI * 2;

/** Gleichmäßige Drehung: `turn` Radiant pro Sekunde. */
export const spin = (t, turn) => t * turn;

/** Sinus-Schwung um 0 mit Amplitude `amp`, Kreisfrequenz `freq`. */
export const swing = (t, freq, amp) => Math.sin(t * freq) * amp;

/** Normierte Phase 0..1 innerhalb einer Periode (auch für negatives `t`). */
export const cycle = (t, period) => (((t % period) + period) % period) / period;

/**
 * Pressenhub als Dreieck 0→1→0 über `period` Sekunden:
 * 0 = Kolben ganz oben, 1 = ganz unten. Abgeleitet aus dem Warenfortschritt
 * `prog` (damit die Presse im Takt der Ware arbeitet).
 */
export function pressStroke(prog, period = 1.4) {
  const p = cycle(prog, period);
  return p < 0.5 ? p * 2 : 2 - p * 2;
}

/** Ruhepose je Gerät (angehalten oder Bewegung reduziert). */
export const REST = {
  spike: { angle: 0 },
  press: { stroke: 0.15 },
  blade: { angle: 0.2 },
  schleuder: { angle: 0.6 },
};

/** Posenschreiber je Gerät – geben nur Zahlen zurück, nie Seiteneffekte. */
export const POSES = {
  spike: (t) => ({ angle: spin(t, 3) }),
  press: (t, o) => ({ stroke: pressStroke(o.prog || 0) }),
  blade: (t) => ({ angle: swing(t, 8, 0.25) }),
  schleuder: (t) => ({ angle: spin(t, 7) }),
};

/** Soll sich eine laufende, eingeschaltete Maschine sichtbar bewegen? */
export const moving = (running, on) => running && on !== false && !reducedMotion();

/**
 * Pose für `kind` zur Zeit `t`.
 * `opts.still` erzwingt die Ruhepose; `opts.prog` (Presse) steuert den Hub.
 * Unbekannte Geräte liefern `null`.
 */
export function pose(kind, t, opts = {}) {
  const fn = POSES[kind];
  if (!fn) return null;
  if (opts.still) return { ...REST[kind] };
  return fn(t, opts);
}
