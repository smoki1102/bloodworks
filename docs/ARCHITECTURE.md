# Architektur

Abhängigkeiten laufen strikt in eine Richtung (keine Zyklen):

`config` / `utils` → `core` (Zustand, Regeln, Simulation) → `render` (Canvas) → `ui` (DOM, Eingabe) → `main` (Spielschleife)

| Ordner                    | Aufgabe                                                                 |
| ------------------------- | ----------------------------------------------------------------------- |
| `src/config/`             | Konstanten sowie Gebäude-, Upgrade- und Quest-Definitionen (reine Daten)|
| `src/utils/`              | Mathe- und Format-Helfer                                                |
| `src/core/state.js`       | Globaler Spielzustand (`S`, Listen), `setState`, `initSim`              |
| `src/core/anatomy.js`     | Stickman-Modell: `makeBody`, `severLimb`, `bleedOut`, `bodyToCorpse`    |
| `src/core/placement.js`   | Bauen, Verkaufen, Kollisionsregeln, `placeReason`, Undo-History         |
| `src/core/machines.js`    | `machine()`-Tick pro Gerät, `runFactor`, Dreck aus Arbeit               |
| `src/core/flow.js`        | Verbindungen (Tank-Anschlüsse), Übergaben (Ofen/Säure), Statistik       |
| `src/core/effects.js`     | Partikel, Toasts, `bloodColor` (Gore-Stufen)                            |
| `src/core/upgrades.js`    | Forschung: Kauf gegen Blut, Effekt-Multiplikatoren (`S.up.lv`)          |
| `src/core/quests.js`      | Auftragskette: Fortschritt über Metriken, Abschluss mit Belohnung       |
| `src/core/simulation.js`  | `tick(dt)`: Energie → Maschinen → Flüssigkeiten → Sticks/Leichen       |
| `src/render/renderer.js`  | Clean-Tech-Canvas (hell): Hintergrund, Gebäude, Stühle, Sticks, Pipes   |
| `src/ui/ui.js`            | HUD, Bauliste, Tutorial, Eingabe, Speichern (v8), Shortcuts (Z/E)       |
| `src/ui/inspector.js`     | Geräte-Panel: Status, Auslastung, Durchsatz, Verbindung, An/Aus        |
| `src/ui/research.js`      | Forschungs-Panel (DOM): Level-Pips, Blutkosten, Kaufen                 |
| `src/ui/quests.js`        | Auftrags-Anzeige (DOM): Balken, Fortschritt, Abschluss-Toast            |
| `tests/`                  | Vitest-Tests für Platzierung, Simulation, Forschung und Aufträge        |

## Kernregeln (Warenflüsse)

- Der Eingang (`spawn`) setzt Sticks **direkt auf mitfahrende Stühle** am Band (State `ride`). Sie sitzen permanent, bis sie sterben, die Maschinen sie erledigen, eine **Bandlücke** sie dynamisch abwirft (Impuls + Spin, `S.ejected`) oder sie am rechten Ende entkommen.
- Der **Abschleuderer** (`schleuder`, `kill: 'eject'`) wirft sitzende Sticks mitsamt Stuhl über die Bandkante in den Keller.
- Container (`bin`) zerlegt Leichen zu Blut auf den **Boden** (`floorBlood`), nicht direkt in den Tank.
- `drain` saugt Bodenblut in einen Puffer (max. `DRAIN_BUF`); er pumpt nur weiter, wenn ein **Tank daneben** angehängt ist (`b.link === 'ok'`).
- `market` und `gen` brauchen einen **Tank direkt darunter** (gleiche Spalten, anderes Band) – sichtbar als Rohr.
- Ofen/Säure ziehen Leichen aus einem **angrenzenden** Container (Übergabe mit Backpressure).
- Energiebedarf skaliert mit der Auslastung: `e · (0.25 + 0.75 · util)`; ausgeschaltete Geräte (`b.on`) verbrauchen nichts.
- Forschung (`upgrades.js`) ändert Multiplikatoren aus `S.up.lv` (Bandtempo, Marktpreis, Spawn-Intervall, Tank-Cap).

## Neues Gebäude hinzufügen

1. Eintrag in `DEF` (`src/config/building-defs.js`) inkl. `cap`.
2. Verhalten in `machine()` (`src/core/machines.js`).
3. Systeme in `flow.js` (`horizontal`/`vertical`/`pullItems`) falls nötig.
4. Wirkung auf Sticks in `moveSticks()` (`src/core/simulation.js`, `d.kill`).
5. Optik als `case` in `drawMachine()` (`src/render/renderer.js`).
6. Test in `tests/simulation.test.js`.

## Eingabe

- `1–3` Kategorie, `Escape` Abbruch, Pfeil-Auswahl, Klick baut/platziert.
- `Space` Pause, `E` An/Aus am gewählten Gerät, `Entf` Verkaufen, `Strg/Cmd+Z` Undo.
- Geräte-Panel zeigt Status, Auslastung, Fortschritt, Durchsatz und Verbindung.

## Spielstand

`localStorage`, Schlüssel `bloodworks_v8` (`v: 8`). Enthält Gerätezustand (`on`, `buf`), Items inkl. `kind`/`part` sowie Zähler (Kills, `ejected`, `caught`, `toggled`), Auftragsindex und Forschungsstand (`up.lv`). `load()` liest auch `v: 7` und setzt fehlende Felder auf Defaults. Bei Formatänderungen die Version erhöhen und `hasSave`/`load` anpassen.