# Architektur

Abhängigkeiten laufen strikt in eine Richtung (keine Zyklen):

`config` / `utils` → `core` (Zustand, Regeln, Simulation) → `render` (Canvas) → `ui` (DOM, Eingabe) → `main` (Spielschleife)

| Ordner                    | Aufgabe                                                                 |
| ------------------------- | ----------------------------------------------------------------------- |
| `src/config/`             | Konstanten und Gebäude-Definitionen (reine Daten, inkl. `cap`)          |
| `src/utils/`              | Mathe- und Format-Helfer                                                |
| `src/core/state.js`       | Globaler Spielzustand (`S`, Listen), `setState`, `initSim`              |
| `src/core/anatomy.js`     | Stickman-Modell: `makeBody`, `severLimb`, `bleedOut`, `bodyToCorpse`    |
| `src/core/placement.js`   | Bauen, Verkaufen, Kollisionsregeln, `placeReason`, Undo-History         |
| `src/core/machines.js`    | `machine()`-Tick pro Gerät, `runFactor`, Dreck aus Arbeit               |
| `src/core/flow.js`        | Verbindungen (Tank-Anschlüsse), Übergaben (Ofen/Säure), Statistik       |
| `src/core/effects.js`     | Partikel, Toasts, `bloodColor` (Gore-Stufen)                            |
| `src/core/simulation.js`  | `tick(dt)`: Reihenfolge Energie → Maschinen → Flüssigkeiten → Sticks  |
| `src/render/renderer.js`  | Clean-Tech-Canvas (hell): Hintergrund, Gebäude, Sticks, Pipes, Ghost    |
| `src/ui/ui.js`            | HUD, Bauliste, Tutorial, Eingabe, Speichern (v7), Shortcuts (Z/E)       |
| `src/ui/inspector.js`     | Geräte-Panel: Status, Auslastung, Durchsatz, Verbindung, An/Aus        |
| `tests/`                  | Vitest-Tests für Platzierung, Simulation und Warenflüsse                |

## Kernregeln (Warenflüsse)

- Container (`bin`) zerlegt Leichen zu Blut auf den **Boden** (`floorBlood`), nicht direkt in den Tank.
- `drain` saugt Bodenblut in einen Puffer (max. `DRAIN_BUF`); er pumpt nur weiter, wenn ein **Tank daneben** angehängt ist (`b.link === 'ok'`).
- `market` und `gen` brauchen einen **Tank direkt darunter** (gleiche Spalten, anderes Band) – sichtbar als Rohr.
- Ofen/Säure ziehen Leichen aus einem **angrenzenden** Container (Übergabe mit Backpressure).
- Energiebedarf skaliert mit der Auslastung: `e · (0.25 + 0.75 · util)`; ausgeschaltete Geräte (`b.on`) verbrauchen nichts.

## Neues Gebäude hinzufügen

1. Eintrag in `DEF` (`src/config/building-defs.js`) inkl. `cap`.
2. Verhalten in `machine()` (`src/core/machines.js`).
3. Systeme in `flow.js` (`horizontal`/`vertical`/`pullItems`) falls nötig.
4. Optik als `case` in `drawMachine()` (`src/render/renderer.js`).
5. Test in `tests/simulation.test.js`.

## Eingabe

- `1–3` Kategorie, `Escape` Abbruch, Pfeil-Auswahl, Klick baut/platziert.
- `Space` Pause, `E` An/Aus am gewählten Gerät, `Entf` Verkaufen, `Strg/Cmd+Z` Undo.
- Geräte-Panel zeigt Status, Auslastung, Fortschritt, Durchsatz und Verbindung.

## Spielstand

`localStorage`, Schlüssel `bloodworks_v7` (`v: 7`). Enthält Gerätezustand (`on`, `buf`) und Items inkl. `kind`/`part`. Bei Formatänderungen die Version erhöhen und `hasSave`/`load` anpassen.