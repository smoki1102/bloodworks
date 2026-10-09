# Architektur

Abhängigkeiten laufen strikt in eine Richtung (keine Zyklen):

`config` / `utils` → `core` (Zustand, Raster, Regeln, Simulation) → `render` (Canvas) → `ui` (DOM, Eingabe) → `main` (Spielschleife)

## Ordner und Module

| Ordner / Datei            | Aufgabe                                                                 |
| ------------------------- | ----------------------------------------------------------------------- |
| `src/config/constants.js` | Globale Zahlen: Raster, Zellgröße, Tempo, Wirtschaft, `TARGETS`, Tasten, Richtungen (0–3 orthogonal, 4–7 diagonal: `DX`/`DY`, `opp`, `isDiag`, `dirOf`, `compsOf`) |
| `src/config/building-defs.js` | Gebäude-Daten (`DEF`), Kategorien (`CATS`) – reine Daten            |
| `src/config/skill-defs.js`| Skill-Äste und Knoten inkl. Währung, Kosten, Stufen, `fx`, `unlock`      |
| `src/config/tutorial-defs.js` | Die 12 Tutorialschritte (Text, Zielzelle, zu bauendes Item, Bedingung) |
| `src/config/upgrade-defs.js`, `quest-defs.js` | Bestehende Forschung und Aufträge (unverändert)    |
| `src/config/palette.js`   | Kanonische Quellen: `UI` (DOM-Farben), `METRICS` (Abstände/Radien/Schatten/Font/Dauer), `CANVAS` (Canvas-Palette `C`, inkl. Material-/Blut-/Effektfarben), `CSS_MAP`, `rgba(hex, a)`. `applyTokens()` schreibt `UI`+`METRICS` auf `:root` |
| `src/utils/helpers.js`    | Mathe-, Format- und DOM-Helfer (`$`, `fmt` mit deutscher Tausendertrennung, `clamp`, `rnd`) |
| `src/utils/perf.js`       | Zeitmessung der Spielschleife (`setPerf`, `perfBegin`/`perfEnd`, `perfCount`, `perfFrame`, `perfSnapshot`); aus, bis `?perf`/`?bench` es einschaltet – siehe „Messung und Bench“ |
| `src/core/state.js`       | Globaler Spielzustand `S`, Listen (`blds`, `sticks`, `corpses`, `parts` = Partikel, `floorBlood`, `nets`), `defaultFx`, `setState`, `initSim` |
| `src/core/grid.js`        | Raster: `cellAt`, `bldAtCell`, `bldRect`, `viewCells`, `visibleRect`, `supportBelow` |
| `src/core/placement.js`   | `addBuilding`, `placeReason`, `originOf`, Locks, Kosten, Verkauf, Undo (auch Gruppen)  |
| `src/core/parts.js`       | Körperteil-Vorrat (`collectPart`, `partPoints`) – Skill-Währung         |
| `src/core/anatomy.js`     | Stickman: `makeBody`, `severPart`, `isDead`, `filterMatch`, `makeBody`  |
| `src/core/belts.js`       | Waren auf Bändern: `feed`, `stepTransport`, `roomIn`, `itemPos`, `edgePoint`, `beltPathPoints` (Eintritt → Mitte → Austritt), `entryDirOf` (`fromDir`), `lenOf` |
| `src/core/belt-path.js`   | Bau einer Bandstrecke: `planBeltPath` (Diagonale + gerader Rest, beide Reihenfolgen) und `buildBeltPath` (alles-oder-nichts, eine Rückgängig-Einheit) |
| `src/core/pipes.js`       | Rohrnetze: `rebuildNets`, Absaug-Indiz (`suckNet`, `suctionNetOf`), `addBlood`/`takeBlood`/`spendBlood`, `bloodTotal` |
| `src/core/skill.js`       | Skill-Stufen, `buySkill`, `recomputeFx` (setzt `S.fx`), `giveSkillGift` |
| `src/core/market.js`      | Blutmarkt: Verkauf, Reserve (`setReserve`, `sellable`)                  |
| `src/core/machines.js`    | Geräte-Tick: Spawn, Senken, Weiche/Filter, Schneiden (`bladeCut`, `hitChance`), Dreck |
| `src/core/flow.js`        | Bestehende Warenübergaben (Ofen/Säure) und Statistik                    |
| `src/core/effects.js`     | Partikel, Toasts, `fluids()` (Sickerung + Absaugung ins Netz, iteriert nur über ein Schmutz-Rechteck statt aller 8192 Zellen – `touch()` bei Zufluss, `resetBloodBounds()` nach `initSim()`), `reducedMotion()`/`setReducedMotion()` (Systemwert oder Nutzer-Override aus dem Einstellungs-Popover) |
| `src/core/simulation.js`  | `tick(dt)`: Netze, Energie, Maschinen, Flow, Bänder, Flüssigkeiten, Sticks, Leichen, Partikel |
| `src/core/upgrades.js`, `quests.js` | Bestehende Forschung und Auftragskette                  |
| `src/render/renderer.js`  | Canvas: Kamera, Culling (Gebäude, Zellen, lose Objekte/Partikel mit 96-px-Rand), Hallenboden/Muster/Verläufe nur im sichtbaren Ausschnitt statt `PW×PH`, Grundraster, Gebäude-Regie, Waren, Sticks, Rohre, Hinweise. Re-exportiert `cv`/`C` aus `canvas.js` |
| `src/render/canvas.js`    | Gemeinsamer Kontext `cv`/`ctx` und Palette `C` (kein Import-Zyklus mit `renderer.js`) |
| `src/render/figures.js`   | Figuren/Items: `drawStickFigure`, `drawCorpse`, `drawCorpseShape`, `drawLimbShape`, `drawItemShape` |
| `src/render/prims.js`     | Grundformen für Geräte: `housing`, `bar`, `machineOn`, `queuedItems` |
| `src/render/bands.js`     | Bandraster (`bandRect`, `drawBandStrip`, `drawBandDiag`, `drawBandCorner`) für Bänder und Pass-Maschinen; Eckzellen als durchgehender Bogen; Scroll friert bei reduzierter Bewegung ein |
| `src/render/anim/poses.js`| Reine Posen-Mathematik (`spin`, `swing`, `pressStroke`, `pose`, `moving`) für Walze/Presse/Klinge/Abschleuderer; kein Zustand, kein Canvas |
| `src/render/machines/*.js`| Ein Modul je Gerätetyp; `index.js` dispatcht `drawMachineBody`; Animationsmodule lesen ihre Pose aus `anim/poses.js` |
| `src/render/icons.js`     | Eigenes Icon-Set (27 Icons, 16×16-Vektor): eine Shape-Definition pro Icon, zwei Renderer – `drawIcon` (Canvas) und `iconSvg` (Inline-SVG für DOM-UI). Keine Emoji/Sonderglyphen, keine Fremd-Assets |
| `src/ui/ui.js`            | HUD, Bauliste, Tutorial, Eingabe, Startmenü, Speichern (v9), Shortcuts, Forschungs-Pause (`openForschungUI`/`closeForschungUI`), Token-Init (`applyTokens`, `initIcons`), Einstellungs-Popover |
| `src/ui/tooltip.js`       | Zentrales Tooltip-Element für `data-tip` (Hover + Fokus, 350 ms Delay, Mehrzeilen via `\n`); ersetzt native `title` |
| `src/ui/gallery.js`       | Dev-Galerie (`galleryHtml`, `openGallery`) für Design-Review, nur per `?ui` / `?gallery` in `main.js` geöffnet |
| `src/ui/inspector.js`     | Geräte-Panel: Status, Zielkörperteil, Trefferquote, Reserve, An/Aus     |
| `src/ui/skill.js`         | Skill-Netz als Diagramm im Forschungsfenster: `skillLayout()` (reines Layout: Spalten/Slots), Knoten, Kanten, Kauf |
| `src/ui/research.js`      | Forschungsfenster: Owner, Reiter (Skill-Netz/Upgrades), Header, Pause   |
| `src/ui/quests.js`        | Auftrags-Panel (bestehend)                                              |
| `src/dev/bench.js`        | Bench-Welt (`buildBench(mode)`) für `?bench=std|big` – deterministische Fabrik, nur über `main.js` erreichbar |
| `src/main.js`             | Spielschleife (`frame(ts)` exportiert), HUD- und Tutorial-Intervalle, `?perf`/`?bench`-Modus |
| `tests/`                  | Vitest: `helpers.js`, `dom-stub.js`, `helpers.test`, `placement`, `belt-path`, `belts`, `machines`, `pipes`, `skill`, `skill-layout`, `simulation`, `ui-smoke` |

## Messung und Bench

- `?perf` schaltet `utils/perf.js` ein: Die Schleife misst `sim` (unterteilt in
  `sim.nets`/`sim.machines`/`sim.flow`/`sim.fluids`/`sim.ents`), `render`
  (`render.bg`/`render.blood`/`render.blds`/`render.ents`/`render.fx`/`render.overlay`)
  und `ui` je Frame, zählt `tick` (Aufrufe/Frame) und meldet alle 2,5 s eine Zeile
  `[perf] …` in die Konsole. `perfSnapshot()` liefert dieselben Zahlen strukturiert.
  Ausgeschaltet kostet jeder Aufruf nur einen Booleschen Vergleich.
- `?bench=std|big` baut zusätzlich über `src/dev/bench.js` eine deterministische
  Fabrik (Standard: 5 Linien + Merge/Filter + Rohrnetz; `big`: 10 Linien) und **unterdrückt
  die rAF-Schleife** – `scripts/profile.mjs` treibt `globalThis.__bwFrame(ts)` selbst,
  damit gemessen und gespielt nicht doppelt simuliert wird. Hilfen auf `globalThis`:
  `__bwFrame`, `__bwPerf`, `__bwStats()`, `__bwCam(x, y, z)`.
- `node scripts/profile.mjs` baut das Projekt, startet `vite preview` und Chrome im
  Headless-Modus, navigiert per CDP und misst je Szene drei Kameraausschnitte
  (Detail/Überblick/Nah) über 900 Frames nach 900 Frames Aufwärmen sowie 5 s Echtzeit
  (`&live`, rAF inkl. Rasterisierung). Reine Node-Bordmittel (`fetch`, `WebSocket`),
  keine neuen Dependencies.

## Spielschleife

- `main.js/frame(ts)` (exportiert, von Tests und Bench-Treiber nutzbar) treibt die
  Simulation in **festen** `FIXED_DT = 1/30`-Sekunden-Schritten: `simAcc += dt * S.speed`,
  dann `while (simAcc >= FIXED_DT) tick(FIXED_DT)`. `MAX_DT = 0.05` kappt die gemessene
  Framezeit (Resize, Hintergrund-Tab), `MAX_STEPS = 10` bricht das Aufholen nach einem
  Hänger ab (Rest wird verworfen statt stundenlang nachsimuliert). `S.speed` (1×/2×/4×)
  und Pause wirken unverändert; Rendering läuft weiter in jedem Frame.

## Raster und Koordinaten

- Die Welt ist ein festes Raster: `GRID_W × GRID_H` Zellen à `CELL` Pixeln (`constants.js`).
  Gebäude speichern den **Oberlinken Ursprung** (`b.x`, `b.y`) plus `spanW`/`spanH`.
- `originOf(t, x, y)` rechnet die angeklickte Zelle für große Gebäude in ihren Ursprung um;
  `placeReason`/`addBuilding` erwarten immer den Ursprung.
- Die Kamera liegt frei in der Welt (`S.cam = {x, y, z}`). `viewCells()` und `visibleRect()`
  rechnen den sichtbaren Bereich **um die Kamera zentriert** aus – die linke/obere Bildhälfte
  fehlt sonst. Renderer zeichnet nur Zellen in `visibleRect`.
- Blutfelder (`floorBlood`, `beltBlood`) sind flache Arrays der Länge `GRID_W * GRID_H`
  mit Index `idx(x, y)`; Zeile `0` ist oben, `GRID_H - 1` der Boden.

## Kernregeln

### Bänder, Fallgeschwindigkeit, Waren

- Bänder haben **acht Richtungen**: `dir` 0–3 orthogonal (rechts, runter, links, hoch),
  `4–7` diagonal (NO, SO, SW, NW) – Diagonale entstehen nur aus dem Streckenbau, Maschinen
  und `R` bleiben orthogonal. Ports am Geräte-Rahmen sind **relativ**, die Reisedirektion
  **absolut** – `feed(t, it, d, entry)` prüft beides; ein diagonaler Eingang wird über die
  **Komponentenregel** angenommen (`compsOf(d)` schneidet auf 0–3, passt eine Anteils-
  Richtung zu einem Eingangs-Port). Auf Diagonalen ist die Bandlänge `√2 × Zellbreite`
  (`lenOf`), Ware läuft von Zellecke zur gegenüberliegenden Ecke (`edgePoint`).
- **Band-Ecken:** Jede Bandzelle speichert neben `dir` (Ausgang) auch `fromDir` (Eingang,
  Default `dir`). Knickt der Pfad (diagonal → gerade), hat die Eckzelle `fromDir ≠ dir`;
  `beltPathPoints()` führt sie Eintritt → Zellmitte → Austritt, `itemPos` interpoliert nach
  Bogenlänge – Ware läuft ohne Sprung um die Ecke. Gerade/diagonale Zellen bleiben zweipunktig.
  `planBeltPath`/`withDirs` setzen `from` je Zelle, `drawBandStrip` rendert Eckzellen als
  `drawBandCorner` (dicker Bogen mit runden Enden, Chevrons entlang des Pfads).
  Beim Speichern/Laden wird `fromDir` über die Verkettung `fromDir ?? from ?? dir`
  wiederhergestellt (v12-Fix, siehe CHANGELOG 1.6).
- `MIN_GAP` sichert Abstand zwischen *bewegten* Waren; Waren, die am Eingang warten, dürfen
  enger liegen (sonst blockiert eine Weiche schon den Zulauf).
- Auf dem Band liegende Waren mit `p == null` sind gehalten (Maschinen wie Presse/Klinge).
- Kein Band unter der Ware → sie fällt (`state.js`/`simulation.js`), landet auf dem Boden und
  wird von `fluids()` zu Bodenblut; Leichen verrotten mit `CORPSE_LIFE`.
- Am Bandende ohne Ziel fallen Waren ab – überall dort braucht es einen Container, sonst
  verliert man die Ware.
- **Bandstrecke bauen:** `S.beltFrom` merkt den Startklick, `ui.js/beltAt()` fragt beim zweiten
  Klick `buildBeltPath()` ab. `planBeltPath()` (`belt-path.js`) plant **Diagonale + gerader
  Rest** (beide Reihenfolgen, die freie gewinnt) und nimmt die erste freie; belegt →
  `Blockiert: <Name> (x,y)`, außerhalb → `Außerhalb der Fabrik`, Ziel zu teuer →
  `Zu teuer: n €`, Richtungskonflikt → `Schleifenbildung`. Bestehende Bandzellen werden
  umdirigiert (ohne Kosten), alles oder nichts – danach ist die Strecke eine
  normale Reihe von 1×1-Bändern (Simulation unverändert).

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

1. Eintrag in `DEF` (`src/config/building-defs.js`) inkl. `icon`, `cat`, `kind`, `cap`, `e`, optional `unlock`. Das `icon`-Feld verweist auf einen Namen aus `ICONS` (`src/render/icons.js`); für ein neues Icon dort eine 16×16-Shape-Definition ergänzen.
2. Verhalten in `src/core/machines.js` (`step…`) bzw. `src/core/flow.js`.
3. Optik als `draw()`-Funktion in `src/render/machines/<typ>.js` anlegen und im Dispatcher `src/render/machines/index.js` eintragen. Icon-lastige Maschinen (Logistik, Handel) nutzen `drawIcon(ctx, d.icon, …)`; Detailzeichnungen bleiben eigener Code. Für mehrzellige Geräte immer aus `r` (`bldRect`) rechnen, damit die Zeichnung auf den Footprint skaliert.
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
5. Das Diagramm in `src/ui/skill.js` berechnet `skillLayout()` **rein aus den Daten** (kein
   DOM): Pro Ast ein Block untereinander, pro Knoten die **Spalte nach Voraussetzungstiefe**
   (`depthOf`, `STEP_X`) und pro Spalte eine **Unterzeile (Slot)**. Knoten mit gleichem Ast
   und gleicher Tiefe stapeln sich dadurch untereinander statt zu überlappen; der Slot wird
   bevorzugt vom ersten `req`-Knoten geerbt, sonst der freie. Die Ast-Höhe wächst mit der
   Zahl der Slots (`SLOT_H` + `TAG_H` + `BR_GAP` statt fixem `ROW_H`), die Fläche scrollt.
   `NODE_H` in `skill.js` und die Höhe von `.snode` in `main.css` müssen gleich bleiben
   (aktuell 140 px), sonst rutschen Karten in die nächste Slot-Zeile.

## Eingabe

- `1–5` Kategorie, `R` Drehen, `Escape`/Rechtsklick abwählen, `K` Forschung (pausiert),
  Pfeiltasten/`±` Kamera, Rad zoomen.
- Band: erster Klick = Start, zweiter Klick oder Drag-Loslassen = Ende; Klick auf den Start
  bricht ab (`S.beltFrom`, `clearTool()` setzt auch den Start zurück).
- `Space` Pause, `E` An/Aus, `Entf` Verkaufen, `Strg/Cmd+Z` Undo.
- Inspektor zeigt Status, Auslastung, Zielkörperteil mit Trefferquote, Filterregel,
  Marktreserve und Absaugung/Verbindung; der Inhalt wird nur ersetzt, solange kein
  `INPUT`/`SELECT`/`TEXTAREA` darin den Fokus hat (sonst wäre das Zielauswahl-Dropdown sofort
  geschlossen).

## Spielstand

`localStorage`, Schlüssel `bloodworks_v9` (historisch; Formatversion steckt in `raw.v`,
aktuell `v: 11`). Enthält Geld, Energie, Blut, Aufträge, Forschung, Skill-Stufen samt
Körperteil-Vorrat, Gore-Level, Tutorialstand, Kamera, die Spielzähler in `S.stats`
(`spawned`, `kills`, `sold`, `escaped`, `ejected`, `caught`, `toggled`, `partsSold`,
`schleuder`) sowie alle Gebäude inklusive Zielen, Filterregeln, Reserve und Waren
(Stick-Leichen zusätzlich `body` mit `limbs`/`hp`/`bleeding`/`lost`/`hits`/`php`).
`load()` zieht ältere Stände über die `migrate()`-Stufenliste hoch (v9→v10 zieht die
alten Einzelfelder in `S.stats`, v10→v11 leert die Gebäude wegen der neuen Footprints);
unbekannte/neuere Versionen werden abgelehnt und als Toast gemeldet. Bei
Formatänderungen `SAVE_VER` erhöhen, einen Migrationsschritt in `migrate()` ergänzen
und `save()`/`load()`/`hasSave()` anpassen.

## Tests

- `npm test` – 126 Tests, reines Node (kein DOM nötig).
- `tests/helpers.js`: `boot()` (frische Welt), `put()` (regelkonform bauen), `run(sec)` (takten).
- `tests/quests.test.js`: Quest-Metriken existieren und sind erreichbar, Abschleuderer-Ereignis,
  Teilehandel, Kettenfortschritt, v9→v10-Migration.
- `tests/poses.test.js`: Posen ohne Canvas – Struktur, `spin`-Linearität,
  `swing`-Periodizität, `pressStroke`-Dreieck, `pose(..., {still})` == `REST`, `moving()`
  unter reduzierter Bewegung.
- `tests/palette.test.js`: `UI`/`METRICS`/`CANVAS` gesetzt, `CSS_MAP` zeigt nur auf
  vorhandene Farben, `rgba()`-Umrechnung.
- `tests/gallery.test.js`: `galleryHtml()` ohne DOM – Abschnitte, jedes Icon mit Namen,
  Modus-Titel, keine leeren Token-Werte.
- `tests/ui-smoke.test.js`: u. a. Render-Smoke über jeden Gebäudetyp auf dem neuen
  Footprint und Migration v10→v11 (Fabrik-Reset).
- `tests/skill-layout.test.js`: `skillLayout()` ohne DOM – keine Überlappung, Kanten
  verbinden die Vorgänger nach rechts (lädt `dom-stub.js`, weil `skill.js` einen
  Klick-Handler auf `document` registriert).
- `tests/dom-stub.js`: minimaler DOM-/Canvas-Stub; `getElementById` liefert nur IDs, die
  tatsächlich in `index.html` stehen – **fehlt ein Element, fällt der Test auf**.
- `tests/ui-smoke.test.js` lädt `src/main.js` komplett, führt Frames aus und klickt Buttons,
  Karten und Canvas-Platzierungen durch.
