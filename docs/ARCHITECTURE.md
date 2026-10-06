# Architektur

Abhängigkeiten laufen strikt in eine Richtung (keine Zyklen):

`config` / `utils` → `core` (Zustand, Regeln, Simulation) → `render` (Canvas) → `ui` (DOM, Eingabe) → `main` (Spielschleife)

| Ordner                   | Aufgabe                                                    |
| ------------------------ | ---------------------------------------------------------- |
| `src/config/`            | Konstanten und Gebäude-Definitionen (reine Daten)          |
| `src/utils/`             | Mathe- und Format-Helfer                                   |
| `src/core/state.js`      | Globaler Spielzustand (`S`, Listen), `setState`, `initSim` |
| `src/core/placement.js`  | Bauen, Verkaufen, Kollisionsregeln                         |
| `src/core/effects.js`    | Partikel, Toasts, Blut-Helfer                              |
| `src/core/simulation.js` | `tick(dt)`: Maschinen, Sticks, Leichen, Flüssigkeiten      |
| `src/render/renderer.js` | Zeichnet Hintergrund, Gebäude, Sticks, Partikel            |
| `src/ui/ui.js`           | HUD, Bauliste, Inspektor, Tutorial, Eingabe, Speichern     |
| `tests/`                 | Vitest-Tests für Platzierung und Simulation                |

## Neues Gebäude hinzufügen

1. Eintrag in `DEF` (`src/config/building-defs.js`).
2. Verhalten in `machine()` (`src/core/simulation.js`).
3. Optik als `case` in `drawMachine()` (`src/render/renderer.js`).
4. Test in `tests/`.

## Spielstand

`localStorage`, Schlüssel `bloodworks_v6`. Bei Formatänderungen die Version erhöhen.
