# Architektur

Abhängigkeiten laufen strikt in eine Richtung (keine Zyklen):

`config` / `utils` → `core` (Zustand, Raster, Regeln, Simulation) → `render` (Canvas) → `ui` (DOM, Eingabe) → `main` (Spielschleife)

## Ordner und Module

| Ordner / Datei            | Aufgabe                                                                 |
| ------------------------- | ----------------------------------------------------------------------- |
| `src/config/constants.js` | Globale Zahlen: Raster, Zellgröße, Tempo, Wirtschaft, `TARGETS`, Tasten  |
| `src/config/building-defs.js` | Gebäude-Daten (`DEF`), Kategorien (`CATS`) – reine Daten            |
| `src/config/skill-defs.js`| Skill-Äste und Knoten inkl. Währung, Kosten, Stufen, `fx`, `unlock`      |
| `src/config/tutorial-defs.js` | Die 12 Tutorialschritte (Text, Zielzelle, zu bauendes Item, Bedingung) |
| `src/config/upgrade-defs.js`, `quest-defs.js` | Bestehende Forschung und Aufträge (unverändert)    |
| `src/utils/helpers.js`    | Mathe-, Format- und DOM-Helfer (`$`, `fmt`, `clamp`, `rnd`)             |
| `src/core/state.js`       | Globaler Spielzustand `S`, Listen (`blds`, `sticks`, `corpses`, `parts` = Partikel, `floorBlood`, `nets`), `defaultFx`, `setState`, `initSim` |
| `src/core/grid.js`        | Raster: `cellAt`, `bldAtCell`, `bldRect`, `viewCells`, `visibleRect`, `supportBelow` |
| `src/core/placement.js`   | `addBuilding`, `placeReason`, `originOf`, Locks, Kosten, Verkauf, Undo  |
| `src/core/parts.js`       | Körperteil-Vorrat (`collectPart`, `partPoints`) – Skill-Währung         |
| `src/core/anatomy.js`     | Stickman: `makeBody`, `severPart`, `isDead`, `filterMatch`, `makeBody`  |
| `src/core/belts.js`       | Waren auf Bändern: `feed`, `stepTransport`, `roomIn`, `itemPos`, `edgePoint` |
| `src/core/pipes.js`       | Rohrnetze: `rebuildNets`, Absaug-Indiz (`suckNet`, `suctionNetOf`), `addBlood`/`takeBlood`/`spendBlood`, `bloodTotal` |
| `src/core/skill.js`       | Skill-Stufen, `buySkill`, `recomputeFx` (setzt `S.fx`), `giveSkillGift` |
| `src/core/market.js`      | Blutmarkt: Verkauf, Reserve (`setReserve`, `sellable`)                  |
| `src/core/machines.js`    | Geräte-Tick: Spawn, Senken, Weiche/Filter, Schneiden (`bladeCut`, `hitChance`), Dreck |
| `src/core/flow.js`        | Bestehende Warenübergaben (Ofen/Säure) und Statistik                    |
| `src/core/effects.js`     | Partikel, Toasts, `fluids()` (Sickerung + Absaugung ins Netz), `reducedMotion()` |
| `src/core/simulation.js`  | `tick(dt)`: Netze, Energie, Maschinen, Flow, Bänder, Flüssigkeiten, Sticks, Leichen, Partikel |
| `src/core/upgrades.js`, `quests.js` | Bestehende Forschung und Auftragskette                  |
| `src/render/renderer.js`  | Canvas: Kamera, Culling, Gebäude, Waren, Sticks, Rohre, Hinweise        |
| `src/ui/ui.js`            | HUD, Bauliste, Tutorial, Eingabe, Startmenü, Speichern (v9), Shortcuts, Forschungs-Pause (`openForschungUI`/`closeForschungUI`) |
| `src/ui/inspector.js`     | Geräte-Panel: Status, Zielkörperteil, Trefferquote, Reserve, An/Aus     |
| `src/ui/skill.js`         | Skill-Netz als Diagramm im Forschungsfenster (Knoten, Kanten, Kauf)      |
| `src/ui/research.js`      | Forschungsfenster: Owner, Reiter (Skill-Netz/Upgrades), Header, Pause   |
| `src/ui/quests.js`        | Auftrags-Panel (bestehend)                                              |
| `src/main.js`             | Spielschleife, HUD- und Tutorial-Intervalle                             |
| `tests/`                  | Vitest: `helpers.js`, `dom-stub.js`, `placement`, `belts`, `machines`, `pipes`, `skill`, `simulation`, `ui-smoke` |

## Raster und Koordinaten

- Die Welt ist ein festes Raster: `GRID_W × GRID_H` Zellen à `CELL` Pixeln (`constants.js`).
  Gebäude speichern den **Oberlinken Ursprung** (`b.x`, `b.y`) plus `spanW`/`spanH`.
- `originOf(t, x, y, h)` rechnet die angeklickte Zelle für große Gebäude in ihren Ursprung um;
  `placeReason`/`addBuilding` erwarten immer den Ursprung.
- Die Kamera liegt frei in der Welt (`S.cam = {x, y, z}`). `viewCells()` und `visibleRect()`
  rechnen den sichtbaren Bereich **um die Kamera zentriert** aus – die linke/obere Bildhälfte
  fehlt sonst. Renderer zeichnet nur Zellen in `visibleRect`.
- Blutfelder (`floorBlood`, `beltBlood`) sind flache Arrays der Länge `GRID_W * GRID_H`
  mit Index `idx(x, y)`; Zeile `0` ist oben, `GRID_H - 1` der Boden.

## Kernregeln

### Bänder, Fallgeschwindigkeit, Waren

- Bänder haben vier Richtungen (`dir` 0–3 = rechts, runter, links, hoch). Ports am Geräte-Rahmen
  sind **relativ**, die Reisedirektion **absolut** – `feed(t, it, d, entry)` prüft beides.
- `MIN_GAP` sichert Abstand zwischen *bewegten* Waren; Waren, die am Eingang warten, dürfen
  enger liegen (sonst blockiert eine Weiche schon den Zulauf).
- Auf dem Band liegende Waren mit `p == null` sind gehalten (Maschinen wie Presse/Klinge).
- Kein Band unter der Ware → sie fällt (`state.js`/`simulation.js`), landet auf dem Boden und
  wird von `fluids()` zu Bodenblut; Leichen verrotten mit `CORPSE_LIFE`.
- Am Bandende ohne Ziel fallen Waren ab – überall dort braucht es einen Container, sonst
  verliert man die Ware.

### Blut

- `fluids()` sickert Bodenblut nach unten (`46*dt`), verteilt es seitlich (`15*dt`), wenn unten
  ein Gebäude oder die Weltkante blockiert, und lässt es langsam verdunsten (`0.03`).
  Blut sammelt sich daher am tiefsten Punkt seiner Spalte – Abflüsse gehören **unter** die
  Blutquelle.
- Netze: `rebuildNets()` verbindet Pipe-Zellen zu Netzen; Tanks und Geräte hängen nur an, wenn
  sie **eine Pipe-Zelle berühren**. Mehrere Tanks können dasselbe Netz speisen. Ohne Pipe gilt
  der globale Pool (`bloodTotal`, `globalCap`).
- Absaugung: `buildSuction()` (aus `rebuildNets`, triggert über `S.netDirty`, das
  `markDirty()` bei jeder Platzierung/Änderung setzt) schreibt für jede Band- und
  Maschinenzelle den Index eines **nutzbaren** Netzes (mit mindestens einem Tank) in
  `suckNet[i]` – nur wenn eine orthogonale Nachbarschaftszelle zur Pipe-Zelle dieses Netzes
  gehört. `fluids()` (`effects.js`) saugt Blut in `net.cap - net.v` statt auf den Boden;
  volles Netz führt zu Kammer-Rückstau. Röhren selbst belegen Zellen als `occ` und sind deshalb
  nie auf Bändern. Ohne Anschluss bleibt das bisherige Tropfen unverändert. Der Inspektor zeigt
  `suctionNetOf()` als „Absaugung: Verbunden · Netz #n“.
- Der Blutmarkt hält eine eigene Reserve pro Markt (`market.js`); er verkauft nur oberhalb davon.

### Maschinen und Treffer

- `machine()` liefert je Gerät einen Arbeitstakt; Dreck wächst mit `DIRT_WORK`/`DIRT_IDLE`,
  `runFactor = 1 - dirt/150` bremst die Simulation insgesamt.
- `bladeCut()` trifft mit `hitChance()` = `0.45 + S.fx.hit` (max 95 %) das gewählte Zielteil,
  sonst zufällig; der Skill „Mehrfachziele“ (`S.fx.multi`) trennt zusätzlich Teile aus der
  Zielgruppe. Ohne Zielgruppe genau ein Teil pro Schnitt.
- `severPart()` respektiert `maxLimbs()` (Gore-Level) und zählt das Teil sofort in `S.parts`.

## Neues Gebäude hinzufügen

1. Eintrag in `DEF` (`src/config/building-defs.js`) inkl. `cat`, `kind`, `cap`, `e`, optional `unlock`.
2. Verhalten in `src/core/machines.js` (`step…`) bzw. `src/core/flow.js`.
3. Optik als `case` in `drawMachine()` (`src/render/renderer.js`).
4. Kategoriekarten aktualisieren sich automatisch über `cat`.
5. Test in `tests/machines.test.js` bzw. `tests/simulation.test.js`.

## Neuen Skill-Knoten ergänzen

1. Knoten in `src/config/skill-defs.js` anlegen – **kein Code nötig**, nur Daten:

   ```js
   {
     id: 'mach_foo',            // eindeutig
     br: 'mach',                // Ast (bestimmt die Währung: prec = Blut, sonst Teile)
     n: 'Name', d: 'Wirkung in einem Satz.',
     costs: [40, 60, 90],       // Kosten pro Stufe
     max: 3,                    // muss zu costs.length passen
     req: [['mach_speed', 1]],  // optional: [knotenId, mindeststufe]
     fx: [{ k: 'machSpeed', mul: 1.1 }],   // optional, wirkt sofort über S.fx
     unlock: ['schleuder'],     // optional: schaltet Gebäude frei
   }
   ```

2. `fx`-Schlüssel müssen in `defaultFx()` (`src/core/state.js`) existieren – fehlt dort der
   Schlüssel, wird der Effekt nicht angewandt.
3. Wirkung einbauen: Multiplikatoren über `S.fx.<key>` lesen (Beispiel `machines.js`,
   `pipes.js`, `belts.js`).
4. Test ergänzen: Kauf + `recomputeFx()` in `tests/skill.test.js`, Wirkung im passenden
   Systemtest (z. B. `tests/machines.test.js`).
5. Das Diagramm in `src/ui/skill.js` positioniert Knoten automatisch nach Ast/Verzweigungstiefe
   (`depths`, `NODE_W`/`STEP_X`/`ROW_H`) – bei Knoten ohne `req` wächst das Netz um eine Spalte.

## Eingabe

- `1–5` Kategorie, `R` Drehen, `Escape`/Rechtsklick abwählen, `K` Forschung (pausiert),
  Pfeiltasten/`±` Kamera, Rad zoomen.
- `Space` Pause, `E` An/Aus, `Entf` Verkaufen, `Strg/Cmd+Z` Undo.
- Inspektor zeigt Status, Auslastung, Zielkörperteil mit Trefferquote, Filterregel,
  Marktreserve und Absaugung/Verbindung; der Inhalt wird nur ersetzt, solange kein
  `INPUT`/`SELECT`/`TEXTAREA` darin den Fokus hat (sonst wäre das Zielauswahl-Dropdown sofort
  geschlossen).

## Spielstand

`localStorage`, Schlüssel `bloodworks_v9` (`v: 9`). Enthält Geld, Energie, Blut, Aufträge,
Forschung, Skill-Stufen samt Körperteil-Vorrat, Gore-Level, Tutorialstand, Kamera sowie alle
Gebäude inklusive Zielen, Filterregeln, Reserve und Waren. Inkompatible Versionen werden
verworfen und im Spiel als Toast gemeldet (`load()` in `src/ui/ui.js`). Bei Formatänderungen
`SAVE_VER` erhöhen und `save()`/`load()`/`hasSave()` anpassen.

## Tests

- `npm test` – 67 Tests, reines Node (kein DOM nötig).
- `tests/helpers.js`: `boot()` (frische Welt), `put()` (regelkonform bauen), `run(sec)` (takten).
- `tests/dom-stub.js`: minimaler DOM-/Canvas-Stub; `getElementById` liefert nur IDs, die
  tatsächlich in `index.html` stehen – **fehlt ein Element, fällt der Test auf**.
- `tests/ui-smoke.test.js` lädt `src/main.js` komplett, führt Frames aus und klickt Buttons,
  Karten und Canvas-Platzierungen durch.
