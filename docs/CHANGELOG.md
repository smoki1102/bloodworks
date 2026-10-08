# Changelog

## 0.9.6 – Politur/Performance/Doku (08.10.2026)

### Änderungen an bestehendem Code

- **`fluids()`-Performance:** Blut-Simulation iteriert nur noch über ein
  Schmutz-Rechteck (`touch()` expandiert bei Zufluss, `fluids()` verengt pro
  Tick) statt zweimal über alle 8192 Zellen. `addBinBlood` nutzt jetzt
  `addFloorBlood` (konsistent zum Dirty-Rect); `resetBloodBounds()` nach
  `initSim()`.
- **Save-Migration:** `migrate()`-Infrastruktur in `load()`/`hasSave()` –
  künftige SAVE_VER-Bumps können alte Spielstände schrittweise hochziehen.
  SAVE_VER bleibt 9.
- **Texte:** Quest „Lücke & Fang": „im Keller (Container)" → „im Container";
  Tutorial-Abfluss: irreführende Platzierungs-Hinweis formuliert („unten an
  die Hallenkante, dorthin sickert das Blut").

### Qualität

- `npm run check` = ESLint + 93 Vitest-Tests (10 Dateien) + Vite-Build, fehlerfrei.
- Tests `pipes`/`simulation` nutzen jetzt die public API (`addFloorBlood`/
  `addBeltBlood`) statt direkter Array-Schreibweise.

## 0.9.5 – Mechanik/Balance (08.10.2026)

### Behobene Fehler

- **Verkaufsstelle:** Warenwert-Multiplikator von 8 auf 2 gesenkt
  (`SHOP_VALUE_MULT`, ~248 €/s → ~62 €/s bei vollem Körperwert).
- **Forschung:** Upgrades bezahlen jetzt aus dem Gesamtpool (freies Blut +
  Tanks), nicht nur aus `S.blood`; die Schaltflächen-Anzeige prüft ebenfalls
  `bloodTotal()`. Konsistent zum Skill-Tree (`spendBlood`).
- **Labor:** reinigt jetzt nur noch Gebäude innerhalb von `LAB_RANGE` (10
  Zellen) um das Labor, statt global die ganze Halle.
- **Kamera:** beim Neustart (Tutorial/Neues Spiel) wird die Kamera auf die
  Hallenmitte zentriert statt an der alten Position kleben zu bleiben.
- **Speicherstand:** Stick-Leichen speichern ihren Körper (`body` mit `limbs`,
  `hp`, `bleeding`, `lost`, `hits`, `php`) und überleben damit Speichern/Laden.
- **Bin-Inspektionsbalken:** zeigt jetzt den mittleren Verwesefortschritt der
  enthaltenen Items (`it.rot` / `BIN_ROT_TIME`), nicht mehr den nie gesetzten
  `b.prog`.

### Qualität

- `npm run check` = ESLint + 93 Vitest-Tests (10 Dateien) + Vite-Build, fehlerfrei.
- Save-Version bleibt 9 (Body-Feld optional, abwärtskompatibel).

## 0.9.4 – Hallenboden-Politur (08.10.2026)

### Änderungen an bestehendem Code

- **Hallenboden:** subtile Kachelvariation (einmal gebautes Canvas-Muster mit
  leichter Helligkeitsvarianz pro Viertelzelle + feine Rauschpunkte); überlagert
  die flache `hall`-Fläche.
- **Hallenrand:** harter 3px-Strich entfernt; weicher Abdunkler-Übergang zum
  Hintergrund an allen vier Rändern (Lineargradienten) + dezente Kantenlinie.
- **Bodenblut:** weiche, rotierende Ellipsenflecken mit deterministischem
  Zellenrauschen (`cellNoise`) statt Rechteckstreifen am Zellenfuß; Radius und
  Alpha skalieren weiter mit der Blutmenge.

### Qualität

- `npm run check` = ESLint + 93 Vitest-Tests (10 Dateien) + Vite-Build, fehlerfrei.
- Keine Save-Änderung, keine neuen Dependencies, rein visuell.

## 0.9.3 – Maschinen-/Objekt-Rendering auf Palette (08.10.2026)

### Änderungen an bestehendem Code

- **`palette.js` / `CANVAS`:** Material-Tokens ergänzt – Gehäuse (`panel`),
  dunkles Aktionsgrün (`accentDim`), Rohre (`pipe`, `pipe2`, `pipeDirt`),
  Glas/Innenräume (`glass`, `spawnGlass`), Bänder (`beltInner`, `beltOff`,
  `beltDirt`), Ofenfeuer (`fire`), Säure (`acid`), Glow (`glow`), Balken-
  Hintergründe (`barBg`, `dirtBar`), Schatten (`shadow`), Hallenrand
  (`hallEdge`), Abdunkler (`shade`), Reinigung (`fog`), Weiß (`white`),
  Blut je Gore-Level (`blood0`/`blood50`/`blood100`) und Staub (`dust`).
  Neue Helper-Funktion `rgba(hex, a)` für Hex-Tokens mit Deckkraft.
- **`renderer.js`:** alle verbleibenden Hardcoded-Farben (Bänder, Port-Pfeile,
  Rohre, Maschinen-Innenräume, Overlays „AUS"/„REINIGUNG", Dreck-Balken,
  Warn-Badge, Geisterzellen, Bandvorschau, Tutorial-Hinweise, Hallenrand,
  Auswahlrahmen, Stick-GLUT) auf Palette-Tokens umgestellt; kein `rgba()`/
  Hex-Literal mehr außerhalb `palette.js`.
- Neue Hilfsfunktion `bar()` – einheitlicher Fortschrittsbalken für
  Bin, Ofen, Säure und Shop (vorher vier Copy-Paste-Varianten).
- `housing()`: dezente Bodenschattierung unter dem Gehäuse (Tiefe).
- `effects.js`: `bloodColor()` und Staub-Partikel nutzen `CANVAS`-Tokens.

### Qualität

- `npm run check` = ESLint + 93 Vitest-Tests (10 Dateien) + Vite-Build, fehlerfrei.
- Keine Save-Änderung, keine neuen Dependencies.

## 0.9.2 – Design-Tokens, Tooltip & Tastatur (08.10.2026)

### Neu: Funktionen

- **`src/config/palette.js`:** kanonische Farbquellen für UI (`UI`) und Canvas
  (`CANVAS`) plus Mapping `CSS_MAP` für Token-Namen. Dunkles warmes Anthrazit,
  Stahlgrau-Textstaffel, Industrie-Gelb-Grün als Aktionsfarbe (`--action`),
  Blut-Rot als einziger Akzent (`--accent2`).
- **`applyTokens()` (`ui.js`):** schreibt alle UI-Tokens beim Start auf `:root`
  (JS = Quelle; CSS-Fallbacks bleiben als Deklaration stehen).
- **`src/ui/tooltip.js`:** zentrales Tooltip-Element für `data-tip` (Hover +
  Fokus, 350 ms Delay, Mehrzeilen via `\n`, Positionierung mit Viewport-Klemme).
  Ersetzt langsame native `title`-Tooltips; HUD-Buttons, Ressourcen, Skill-Gesperrt-
  Button und Inspektor-Kopf umgestellt.
- **Einstellungs-Popover** (`#setPop`): Gore-Level (sofort wirksam, spiegelt das
  Startmenü-Segment) und Schalter „Bewegung reduzieren" (`setReducedMotion()`
  in `effects.js`, überschreibt die Systemeinstellung).
- **Tastatur-Bedieneingabe:** Baukarten sind `role="button"`/`tabindex="0"`;
  Enter und Space wählen die Karte (gefangen vor dem globalen Space-Handler).
- **`fmt` (`helpers.js`):** deutsche Tausendertrennung (`1.600`) und
  Komma-Dezimal bei k/M (`12,3k`, `2,5M`); neue `tests/helpers.test.js`.

### Änderungen an bestehendem Code

- `renderer.js`: `C` ist jetzt `CANVAS` aus `palette.js`; verbliebene Hardcoded-
  Farben (Port-Pfeile, Ghost-Zelle, Auswahl, Hinweise) durch Token-Zugriffe ersetzt.
- `main.css`: CSS-Variablen `--tech`/`--tech2`/`--soft-tech` → `--action`/
  `--action2`/`--soft-action`; `:root`-Fallbacks auf Palette-Werte aktualisiert;
  Rest-Härten (`.card .lock`, `.card.tut`, `.snode.can`, `.upg .unlock`) auf
  Tokens umgestellt; neue `.bar i.fill-*`-Klassen.
- `inspector.js`: alle fünf Fortschrittsbalken von Inline-Hex auf
  `fill-blood`/`fill-dim`/`fill-warn`/`fill-ok`/`fill-err` umgestellt.
- `index.html`: `theme-color` angepasst; Ressourcen-`title` → `data-tip`;
  Einstellungs-Button mit `settings`-Icon ergänzt; Gore-Segment im Popover.
- `icons.js`: neue UI-Icons `settings`.

### Qualität

- `npm run check` = ESLint + 93 Vitest-Tests (10 Dateien) + Vite-Build, fehlerfrei.
- Keine Save-Änderung (`SAVE_KEY`/`SAVE_VER` unverändert).

## 0.9.1 – Eigenes Icon-Set, Emoji/Sonderglyphen entfernt (08.10.2026)

### Neu: Funktionen

- **`src/render/icons.js`:** eigenes Icon-Set mit 27 Icons (19 Maschinen/Gebäude + 8 UI),
  jede als reine 16×16-Vektorform definiert (`ICONS`-Tabelle aus Linien, Polygonen,
  Kreisen, Rechtecken, Bögen). Zwei Renderer aus einer Quelle: `drawIcon()` für den
  Canvas, `iconSvg()` für Inline-SVG in der DOM-UI. Keine Emoji, keine Sonderglyphen,
  keine Fremd-Assets, keine neue Dependency.
- Neue UI-Icons: `play`, `pause`, `close`, `power`, `clean`, `energy`, `blood`, `money`.

### Änderungen an bestehendem Code

- `building-defs.js`/`upgrade-defs.js`: Feld `g:` (Schriftglyphen wie `▶ ✹ ☄ ⚡ ≋`) →
  `icon:` (Icon-Name aus `ICONS`). Alle 19 Gebäude und 4 Upgrades umgestellt.
- `renderer.js`: die fünf `ctx.fillText(d.g, …)`-Stellen (Weiche/Zusammenführung/Filter,
  Verkauf, Markt, Generator, Reinraum) zeichnen jetzt `drawIcon()`.
- `ui.js`/`inspector.js`/`research.js`: Bauliste, Inspektor-Kopf, An/Aus- und
  Reinigen-Buttons, Upgrade-Karten und Start-/Pause-Button nutzen `iconSvg()`;
  `initIcons()` ersetzt die statische Energie-Glyphen im HUD.
- `index.html`: Glyphen `⚡ ▶ ✕` entfernt (Icon-Platzhalter bzw. `data-icon`).
- `main.css`: neue `.ico`-Klasse (inline-block, 1em, currentColor); Buttons sind
  `inline-flex` mit `gap`, damit Icon + Label sauber sitzen.
- `docs/ARCHITECTURE.md`: Icon-Modul dokumentiert, Testzahl korrigiert (73 → 89).

### Qualität

- `npm run check` = ESLint + 89 Vitest-Tests (9 Dateien) + Vite-Build, fehlerfrei.
- Unicode-Scan über Quelle/Markup: nur noch typografische Zeichen (`· – — € × → § °`)
  in Prosa und Kommentaren; alle dekorativen Sonderglyphen (`▶ ✹ ▤ ✕ ☄ ▥ ♨ ☣ § ✚ ⑂
  ← ≡ │ ▮ ≋ ⚡ ⏸ ⏻ ✦`) entfernt.

### Annahmen

1. Prosa-Pfeile `→` (z. B. „8 Blut/s → 15 E/s") bleiben typografisch zulässig; ersetzt
   werden nur dekorative Glyphen, die als Icon/Ersatz für Grafik fungieren.
2. Icons erben ihre Farbe per `currentColor` (DOM) bzw. werden mit `C.*` aus der
   Renderer-Palette gefärbt (Canvas) – keine eigenen Icon-Farben.

## 0.9.0 – Echte 45°-Bänder (08.10.2026)

### Neu: Funktionen

- **Diagonale Bandstrecken:** Der Streckenplaner (`belt-path.js`) plant keine L-Routen
  mehr, sondern **Diagonale (45°) + gerader Rest** – beide Reihenfolgen (Diagonale zuerst,
  gerader Rest danach; und umgekehrt), die freie gewinnt. Waren laufen auf Diagonalen von
  Zellecke zur gegenüberliegenden Ecke, die Simulation bleibt eine Reihe von Einzelbändern.
- **Richtungsmodell erweitert:** `dir` kennt jetzt 8 Werte – `0–3` unverändert orthogonal
  (rechts, runter, links, hoch), `4–7` diagonal (NO, SO, SW, NW). Alte Spielstände laden
  unverändert (`SAVE_VER` bleibt **v9**); Diagonale entstehen **nur** aus dem Streckenbau,
  `R` dreht weiterhin nur Maschinen um 90°.
- Neue Helfer in `constants.js`: `isDiag(d)`, `dirOf(sx, sy)` (Verschiebungsvektor →
  Richtung) und `compsOf(d)` (orthogonale Anteile einer Diagonalen).

### Änderungen an bestehendem Code

- `belts.js`: `lenOf` auf Diagonalen `√2 × Zellbreite` (gleiche Geschwindigkeit, längere
  Strecke), `edgePoint`/`exitCellOf` kennen die vier Ecken, `latOf` richtet die Spur eines
  diagonalen Eingangs an der Achse des Maschinen-Ports aus. `feed()` akzeptiert einen
  diagonalen Eingang über die **Komponentenregel**: passt eine der beiden orthogonalen
  Anteile (`compsOf`) zu einem Eingangs-Port, wird die Ware angenommen – sonst gilt wie
  bisher: Fehlausrichtung = Stau.
- `placement.js`: `autoDir` scannt alle 8 Richtungen; eine diagonale Zufuhr wird erkannt
  und fortgesetzt. `dirOk` prüft Ping-Pong über `opp()` (auch diagonal).
- `belt-path.js`: `route()` ersetzt die L-Variante durch Diagonale + Rest, `withDirs`
  rechnet über `dirOf(sx, sy)`; Prüfung, Kosten, alles-oder-nichts und Gruppen-Undo sind
  unverändert.
- `renderer.js`: Diagonale Bänder werden als gedrehter Streifen (Ecke zu Ecke, ±45°/±135°)
  mit animierten Chevrons gezeichnet; Pfeile in `drawPorts` kommen aus `DX`/`DY` (für
  orthogonal exakt identisch); die Pfad-Vorschau zeigt zusätzlich die echten Travel-Segmente
  (Eintritts→Austrittspunkt je Zelle).
- Maschinen bleiben orthogonal (`S.dir`, R-Taste, Spawn-`exitCellOf`); Pipes, Weichen und
  Senken sind richtungsunabhängig oder orthogonal und bleiben unverändert.

### Qualität

- `npm run check` = ESLint + 89 Vitest-Tests (9 Dateien) + Vite-Build, fehlerfrei.
- `tests/belt-path.test.js`: reine Diagonale, gemischte Route (Diagonale + Rest), freier
  gerader Knick bei blockierter Diagonale, alle vier Diagonalrichtungen, Schleifenbildung
  auch diagonal. `tests/belts.test.js`: Transport über die Diagonale, Übergabe ans Bandende
  in eine Maschine, Komponentenregel für `feed`, Position auf der Diagonale (Ecken).
  `tests/placement.test.js`: diagonales Ping-Pong. `tests/ui-smoke.test.js`: Zweiklick-Bau
  einer diagonalen Strecke über echte Canvas-Eingabe.

### Annahmen

1. Eingangssprung ≤ halbe Zelle, wenn eine orthogonale Quelle (Spawn/Maschine) in eine
   diagonale erste Zelle liefert – der Wareneintritt liegt an der Zellecke.
2. `MIN_GAP` bleibt ein Anteil der Zelllänge; auf Diagonalen ist der Lückenabstand in
   Pixeln entsprechend größer (`√2`).
3. Maschinen nehmen diagonale Zufuhr über die Komponentenregel an; passt keine Komponente
   zu ihren Eingangs-Ports, stockt die Ware wie bei falsch ausgerichteten Bändern bisher.


## 0.8.0 – Förderband als Strecke, Lift-Band entfällt (08.10.2026)

### Neu: Funktionen

- **Förderband mit zwei Klicks:** Werkzeug wählen, auf die **Startzelle** klicken, dann auf
  die **Zielzelle** – die Strecke zieht sich gerade oder um die Ecke. Ein Drag (Loslassen auf
  einer anderen Zelle) baut ebenfalls; Klick auf die Startzelle, `Escape` oder Rechtsklick
  bricht ab. Die Vorschau zeigt Pfad, Zellenzahl, Kosten und bei Problemen den Grund
  („Blockiert: Presse (12,56)“, „Schleifenbildung“, „Zu teuer: 80 €“).
- Neues `src/core/belt-path.js`: `planBeltPath()` prüft beide L-Varianten (erst waagerecht,
  dann senkrecht – und umgekehrt) und nimmt die erste freie, `buildBeltPath()` baut
  alles-oder-nichts mit **einer** Rückgängig-Einheit für die ganze Strecke.

### Änderungen an bestehendem Code

- **Lift-Band entfernt:** `DEF.lift`, `S.span`, `LIFT_SPAN` und alle `kind: 'lift'`-Zweige in
  `placement.js`, `grid.js`, `belts.js`, `machines.js` und `renderer.js` entfallen – es gibt
  nur noch die Strecke, die Baukarte und das Spannweiten-Tastenkürzel entfallen.
- `originOf`/`placeReason`/`ghostCells`/`addBuilding` brauchen keinen Höhenparameter
  mehr; die Bandrichtung (`R`) bleibt für andere Bausteine, beim Streckenbau kommt `dir`
  automatisch aus dem Pfad.
- Belegte Zellen auf der Strecke: bestehende Bänder werden umdirigiert und kostenlos
  übernommen, alles andere (Maschinen, Weltkante, zu wenig Geld) stoppt den **ganzen** Pfad –
  es entsteht nie ein halber Weg.
- Simulation unverändert: eine Strecke bleibt eine Reihe von Einzelbändern (1 × 1) mit
  bestehenden Übergaben; nur der Bauablauf ist neu.
- Speicherstand bleibt **v9**: alte `lift`-Einträge werden beim Laden übersprungen
  (`if (!DEF[o.t]) continue`), neue Bänder schreiben `spanH: 1` wie jedes 1×1-Teil.
- Tutorial-Texte der Band-Schritte beschreiben den Start-/Endpunkt-Klick; die Baukarten-
  Beschreibung von „Förderband“ ebenfalls.

### Qualität

- `npm run check` = ESLint + 81 Vitest-Tests (9 Dateien) + Vite-Build, fehlerfrei.
- Neue `tests/belt-path.test.js` (8 Tests): gerade Strecke mit Richtungen, L-Pfad um die
  Ecke, freier Knick bei Blockade, Ablehnung komplett bei Maschine, Schleifenbildung am
  Pfadende, „Außerhalb der Fabrik“/„Zu teuer“, Kostenabzug plus Rückgängig, Übernahme
  bestehender Bänder ohne Kosten.
- `tests/belts.test.js`: Waren fahren um die Ecke eines gebauten L-Pfads (ersetzt den
  Lift-Test); `tests/ui-smoke.test.js`: Zweiklick-Bau über echte Canvas-Eingabe inklusive
  Pfad-Vorschau.

### Annahmen

1. Alte Spielstände werden **nicht** migriert: `lift`-Einträge fallen beim Laden weg, der
   Rest der Fabrik bleibt unverändert.
2. Der Pfad ist immer gerade oder L-förmig; sind beide Varianten blockiert, zeigt die
   Vorschau die erste als Fehlergrund (Zickzack-Routen gibt es bewusst nicht).


## 0.7.2 – Skill-Netz ohne Überlappung (08.10.2026)

### Behobene Fehler

- Im Reiter **Skill-Netz** lagen Knoten mit gleichem Ast und gleicher Voraussetzungstiefe
  exakt übereinander und überdeckten sich: `prec_multi`/`prec_blade`, `mach_dirt`/`mach_speed`,
  `mach_power`/`mach_dmg`, `eco_shop`/`eco_build`. Ursache: Die X-Position kam allein aus der
  Tiefe (`depthOf`), die Y-Position nur aus dem Ast (`ROW_H`) – gleiche Tiefe im selben Ast
  erging dieselbe Koordinate, die Kanten verliefen entsprechend unsauber.

### Änderungen an bestehendem Code

- Neues reines `skillLayout()` in `src/ui/skill.js` (kein DOM): Spalten weiter nach
  Voraussetzungstiefe, Knoten gleicher Tiefe rasten in **Unterzeilen (Slots)** ein – bevorzugt
  in der Unterzeile ihres ersten Voraussetzungs-Knotens, damit die Baumstruktur lesbar bleibt
  (Maschinen werden ein 2×2-Grid). Die Ast-Höhe wächst mit der Zahl der Slots
  (`SLOT_H`/`TAG_H`/`BR_GAP` statt fixem `ROW_H`); `renderSkill()` rendert nur noch aus diesen
  Positionen, die Kanten-Anker nutzen die echte Knoten-Y (funktioniert auch für Knoten mit
  astfremden Voraussetzungen).
- Der `depths`-Cache wird pro Layout-Aufruf geleert statt module-weit gehalten.
- `.snode` bekommt eine feste Höhe von 140 px (`box-sizing: border-box`, `overflow: hidden`),
  passend zu `NODE_H` – sonst rutschen Karten mit Unlock-Zeile in die nächste Slot-Zeile.

### Qualität

- `npm run check` = ESLint + 73 Vitest-Tests (8 Dateien) + Vite-Build, fehlerfrei.
- Neue Tests `tests/skill-layout.test.js`: alle 20 Knoten genau einmal positioniert, keine
  Rechteck-Überlappung, Knoten und Tags innerhalb der Fläche, jede Kante verbindet ihren
  Vorgänger und verläuft nach rechts, Ast-Tag über den Knoten seines Astes, gleiche Tiefe
  gestapelt statt überlagert.
- Netz wächst je nach Belegung (aktuell 860 × 1636 px) und scrollt im Fenster
  (`#fNet` hat `overflow: auto`).

### Annahmen

1. Das Layout ist rein optisch; Spielstände (v9), Skill-Daten, Kosten und Kauflogik bleiben
   unverändert.
2. Die feste Kachelhöhe (140 px) ist bewusst deterministisch: Beschreibungen sind auf zwei
   Zeilen begrenzt, Unlock-Zeilen passen zusätzlich – kürzere Karten werden oben ausgerichtet.


## 0.7.1 – Forschungsfenster, Absaugung, Zielauswahl (07.10.2026)

### Neu: Funktionen

- **Großes Forschungsfenster:** Skill-Tree und bestehendes Forschungs-Panel sind ein Fenster
  (`index.html` `#forschung`, `ui/research.js`, `ui/skill.js`) mit Kopfzeile (Geld, Blut,
  Körperteile), Schließen-Button und zwei Reitern. Es liegt über der Halle und pausiert beim
  Öffnen wie zuvor (Setzen beim Schließen, `K` als Tastenkürzel, HUD-Button `data-a="openForschung"`).
- **Skill-Netz als Diagramm:** statt Baumliste ein Netz aus Knoten und Verbindungslinien
  (`renderSkill()`, Layout nach Ast und Verzweigungstiefe, SVG-Elbow-Kanten mit Stufen-Label
  „×N“), Ast-Tags, Zustände gesperrt/kaufbar/gekauft mit Erfüllungsfortschritt der Voraussetzungen.
- **Absaugung saugt Bandblut:** orthogonaler Nachbar von Band- bzw. Maschinenzelle zu einer
  Pipe-Zelle eines Netzes mit Tank → das Blut fließt ins Netz statt auf den Boden
  (`buildSuction()`/`suckNet` in `pipes.js`, `fluids()` in `effects.js`); volles Netz führt
  zu Kammer-Rückstau. Der Inspektor zeigt „Absaugung: Verbunden · Netz #n“.

### Behobene Fehler

- Blut troppte trotz angeschlossener Absaugung vom Fließband auf den Boden.
- Das Zielförperteil-Select im Inspektor schloss unmittelbar nach dem Öffnen wieder – der
  Inspektor ersetzt das Markup nicht mehr, solange ein `INPUT`/`SELECT`/`TEXTAREA` im Panel
  den Fokus hat (die stündliche Auslastungs-/Status-Aktualisierung zerstörte das Dropdown).
- `markDirty()` ohne Argumente setzte `S.netDirty` nicht mehr (Bänder und Maschinen veränderten
  die Absaugungs-Nachbarschaft), und `rebuildNets()` ließ alte `netId`s an Bauten stehen.

### Änderungen an bestehendem Code

- `#btnSkill` entfallen; HUD-Button heißt „Forschung“ (`openForschungUI`/`closeForschungUI`
  in `ui.js`, Pausen-Flag nur fortsetzen, wenn wir selbst pausiert haben).
- `renderForschung()` löst `renderResearch()` aus `main.js` ab; Upgrades rendern nach `#fUpg`.
- Tutorialschritt zum Skill-Baum beschreibt nun das große Forschungsfenster.

### Annahmen

1. Rohre belegen Zellen (`occ`) und liegen daher nie auf Bändern; „angeschlossene Absaugung“
   ist die orthogonale Nachbarschaft Band/Maschine ↔ Pipe-Zelle eines nutzbaren Netzes.
2. Ohne Absaugung bleibt das bisherige Tropfen exakt unverhalten (Regel aus §6 des Prompts).
3. Der Diagramm-Layout ist rein optisch (Knoten automatisch nach Tiefe), Spielstände (v9)
   bleiben unverändert gültig.
4. Pausieren beim Öffnen gilt weiterhin; schließt man ohne laufendes Spiel, wird nichts
   erneut gestartet.

### Qualität

- `npm run check` = ESLint + 67 Vitest-Tests (7 Dateien) + Vite-Build, fehlerfrei.
- Neue Tests: Absaugung (mit/ohne Anschluss, Blut im Netz) in `tests/pipes.test.js`;
  Forschungsfenster öffnen/Reiter schließen, Inspektor „Absaugung“ und Zielauswahl
  in `tests/ui-smoke.test.js`.
- Sichtprüfung per Headless-Chrome (CDP): 20 Skill-Knoten, 13 Kanten, 6 Ast-Tags, Reiterwechsel,
  Pause/Resume über `K`, Select ohne Node-Swaps, 0 JS-Fehler.


## 0.7.0 – Freie Bauwelt, Körperteile, Skill-Tree, Blut-Pipes (07.10.2026)

### Ursprüngliche Anforderung

<details>
<summary>Original-Prompt (unverändert)</summary>

```
Lese dir vorher die Readme durch und die Docs für das grundwissen


# 1. Freies Bauen, keine Stockwerke mehr
- Keller, Obergeschoss und Halle entfallen. Es gibt eine große freie Bauwelt auf einem Raster, in der man überall bauen darf.
- Förderbänder gibt es in allen Richtungen: links, rechts, hoch und runter. Durch Lift-Bänder können Bänder Höhen überwinden.
- Bänder verbinden sich automatisch mit angrenzenden Bändern (Kurven, Übergänge, Lifts).
- Wo kein Band ist, fallen Sticks und Teile nach unten.
- Kamera: Zoomen und Verschieben, damit große Anlagen bedienbar bleiben.


# 2. Sticks sterben nicht sofort
- Jeder Stick hat Körperteile (Kopf, Torso, Arme, Beine) und Lebenspunkte.
- Zustände: gesund, verletzt, verblutend, tot. Maschinen verursachen Teilschaden, der Stick läuft weiter durch die Kette.
- Tod: wenn Kopf oder Torso verloren gehen oder die Lebenspunkte auf 0 fallen.
- Abgetrennte Körperteile sind eigene Objekte. Sie wandern auf Bändern weiter und können in Behälter, Öfen oder Säurebäder gelangen.


# 3. Vertriebsketten und neue Werkzeuge
- Neue Maschine: Presse mit Klingen.
- Für echte Ketten zusätzlich: Weiche (Band teilt sich), Zusammenführung und Filter (Sortierung nach Körperteil oder Zustand).
- Waren (Körperteile, Blut, Asche) lassen sich über Bänder und Weichen gezielt zu Abnehmern leiten: Verkauf, Ofen, Säure, Lager.
- Blutmarkt mit einstellbarer Blutreserve:
  - Im Inspektor des Blutmarkts stellt man per Regler und Zahlenfeld ein, wie viel Blut als Reserve erhalten bleiben soll. Die Einstellung gibt es in absoluten Einheiten und als Prozent der Tankkapazität.
  - Der Blutmarkt verkauft nur Blut oberhalb der Reserve. Liegt der Füllstand darunter, pausiert der Verkauf, und der Inspektor zeigt den Status "Reserve gehalten".
  - Die Reserve bezieht sich auf die Bluttanks, die über Pipes mit dem Blutmarkt verbunden sind. Ist der Blutmarkt mit keinem Tank verbunden, zeigt der Inspektor einen Hinweis.
  - Jeder Blutmarkt hat seine eigene Einstellung, und sie wird gespeichert.
  - Die Reserve schützt Blut für Generatoren und andere Verbraucher, die am selben Netz hängen.


# 4. Gezielte Treffer
- Im Inspektor jeder Maschine wählt man ein Zielkörperteil (Kopf, Arme, Beine, Torso), das gezielt abgetrennt werden soll.
- Ohne Zielwahl trifft die Maschine zufällig.
- Die Trefferquote hängt vom Präzisions-Level der Maschine ab. Dieses Level steigt über den Skill-Tree (Abschnitt 5).


# 5. Skill-Tree für Verbesserungen- Es gibt einen eigenen Skill-Tree-Bildschirm, den man jederzeit über einen Button im HUD öffnet. Das Spiel läuft dabei pausiert.
- Der Baum besteht aus Knoten mit Voraussetzungen, Kosten und mehreren Stufen. Gesperrte, verfügbare und gekaufte Knoten sind klar unterscheidbar. Beim Überfahren eines Knotens erscheinen Effekt, Kosten und Voraussetzungen.
- Bezahlt wird mit zwei Währungen, beide stehen im HUD und im Skill-Tree-Bildschirm:
  - Blut: Der Präzisions-Ast (gezieltes Abtrennen bestimmter Körperteile, höhere Trefferquote, Mehrfachziele) wird mit Blut gekauft. Das Blut wird aus den Bluttanks abgezogen. Reicht der Füllstand nicht, ist der Knoten nicht kaufbar, und der Tooltip zeigt, wie viel Blut fehlt.
  - Körperteile: Alle anderen Äste werden mit abgetrennten Körperteilen gekauft.
- Körperteile werden automatisch gesammelt:
  - Jedes von einer Maschine abgetrennte Körperteil wird sofort automatisch in den Körperteil-Vorrat gezählt, ohne dass man es transportieren oder einsammeln muss.
  - Das Teil selbst läuft weiter durch die Kette und kann trotzdem verkauft, verbrannt oder aufgelöst werden. Es wird nur einmal gezählt.
  - Der Wert pro Körperteil-Typ (zum Beispiel Kopf mehr als Arm) steht in der Konfiguration und ist leicht anpassbar.
- Mindestens diese Äste, jeweils mit mehreren Stufen:
  - Präzision (Blut): höhere Trefferquote beim gezielten Abtrennen, Mehrfachziele.
  - Maschinen (Körperteile): mehr Tempo und Schaden von Klingen, Presse und Walze, weniger Verschmutzung, weniger Energiebedarf.
  - Blut und Pipes (Körperteile): höherer Durchfluss, größere Tankkapazität, weniger Verlust.
  - Logistik (Körperteile): schnellere Bänder, Weichen und Filter mit mehr Kapazität.
  - Wirtschaft (Körperteile): bessere Verkaufspreise für Körperteile und Blut, günstigeres Bauen und Reinigen.
  - Energie (Körperteile): mehr Ertrag aus Generator und Verbrenner.
- Der Skill-Tree kann auch neue Werkzeuge und Maschinen freischalten. Alles, was das Tutorial braucht, ist von Anfang an verfügbar.
- Verbesserungen wirken sofort auf bereits gebaute Maschinen.
- Der Stand des Skill-Trees, der Körperteil-Vorrat und die gekauften Stufen werden gespeichert.
- Die Baumdaten stehen als reine Daten in einer eigenen Konfigurationsdatei, damit man neue Knoten ohne Codeänderung ergänzen kann. Jeder Knoten legt dort seine Währung (Blut oder Körperteile) und die Kosten pro Stufe fest.


# 6. Blut-Pipes
- Pipes sind frei auf dem Raster verlegbar. Maschinen und Bänder haben Absaug-Anschlüsse.
- Ist eine Absaugung angeschlossen, tropft kein Blut mehr vom Fließband.
- Pipe-Netze lassen sich mit Bluttanks verbinden. Es gibt Durchfluss- und Kapazitätsgrenzen, die der Skill-Tree verbessert.
- Ohne Pipe verhält sich Blut wie bisher.


# 7. Animationen
- Stickmen: Laufen, Treffer-Reaktion, Taumeln, Fallen, wegfliegende Körperteile.
- Maschinen: Klingen, Presse und Walze laufen flüssig, mit sichtbarem Leerlauf und Arbeitszustand.
- Pipes: sichtbarer Blutfluss.
- Ziel sind flüssige 60 FPS. `prefers-reduced-motion` wird respektiert.


# 8. Start und Tutorial
- Beim Start erscheint die Frage "Tutorial spielen?" (Ja / Nein / Spielstand laden).
- Das alte Tutorial mit der vorgebauten kleinen Kette entfällt. Auch der Eingang wird selbst gebaut. Das Startgeld reicht für das Tutorial.
- Im Tutorial ist nichts vorgebaut. Man baut Schritt für Schritt die komplette Kette selbst.
- Jeder Schritt zeigt:
  - das benötigte Item in der Bauliste als Highlight,
  - die Zielposition auf dem Raster als pulsierenden Rahmen oder Pfeil,
  - eine kurze Erklärung, warum das Item dort steht.
- Ein Schritt ist erst abgeschlossen, wenn das Item korrekt gebaut ist. Das Tutorial kann jederzeit übersprungen werden.
- Das Tutorial enthält einen eigenen Schritt zur Blutreserve: Der Spieler öffnet den Inspektor des Blutmarkts, hebt den Regler hervor und stellt die Reserve selbst ein. Eine kurze Erklärung nennt den Grund, zum Beispiel: "Die Reserve bleibt im Tank, damit der Generator nicht ohne Blut dasteht." Der Schritt gilt als erledigt, sobald der Regler geändert wurde.
- Am Ende erklärt ein kurzer Schritt den Skill-Tree, und der Spieler bekommt einen ersten Skillpunkt.
- Bei "Nein" startet das Spiel mit einer komplett leeren Welt und Startgeld.
- Am Ende erklärt ein kurzer Schritt den Skill-Tree. Der Spieler bekommt einen kleinen Startvorrat an Blut und Körperteilen, damit er den ersten Knoten selbst kaufen kann.



# 9. Qualität und Abgabe
- Neue Logik (Körperteile, Schaden, Pipes, Lifts, Weichen, Skill-Tree mit Voraussetzungen, Kosten und Effekten, Blutreserve des Blutmarkts) bekommt Tests in `tests/`. Der Reserve-Test prüft: Der Markt verkauft nur oberhalb der Reserve, pausiert darunter und speichert die Einstellung pro Markt.
- `npm run check` (Lint, Tests, Build) muss fehlerfrei durchlaufen.
- Der Spielstand bekommt eine neue Version. Alte Stände werden sauber verworfen, mit Hinweis im Spiel.
- `docs/ARCHITECTURE.md` und README werden aktualisiert, inklusive einer Anleitung, wie man neue Skill-Knoten ergänzt.
- Antworte am Ende kurz mit einer Änderungsliste und den getroffenen Annahmen.
```

</details>

### Neu: Funktionen

**Freie Bauwelt (Raster 128 × 64)**

- Stockwerke entfallen; die Halle ist überall baubar. Neue Module `core/grid.js`
  (Zellen, Belegung, Sichtbereich) und die Kamera (`S.cam`) mit Verschieben und Zoomen.
- Bänder in vier Richtungen (`belts.js`), automatische Verbindungen, **Lift-Band** mit
  freier Spanne (1–8 Zellen) und eigener Bauregel.
- Waren und Leichen fallen ohne Band nach unten und verrotten auf dem Boden; das
  Bodenblut sickert realistisch nach unten und breitet sich seitlich aus (`effects.fluids`).

**Körperteile und Schaden (`parts.js`, `anatomy.js`)**

- Pro Stick Kopf, Torso, Arme, Beine mit Lebenspunkten; Teilschaden, Zustände und Tod
  über Kopf/Torso oder LP 0. Abgetrennte Teile sind eigene Waren.
- Automatische Sammlung: `severPart()` zählt jedes Teil sofort in `S.parts`, die Ware läuft
  weiter durch die Kette.

**Neue Maschinen (`machines.js`, `building-defs.js`)**

- Presse mit Klingen, Weiche, Zusammenführung, Filter (Regel nach Körperteil oder Zustand),
  Blut-Pipe, Bluttank, Abfluss, Blutmarkt, Generator – 20 Gebäude in fünf Bautasten
  (Bänder, Maschinen, Logistik, Rohre, Handel).
- Zielkörperteil im Inspektor mit angezeigter Trefferquote (`hitChance()`),
  „Mehrfachziele“ trennt zusätzliche Teile der Zielgruppe.

**Skill-Tree (`skill-defs.js`, `skill.js`, `ui/skill.js`)**

- Eigener Bildschirm (HUD-Button oder `K`), pausiert das Spiel. Sechs Äste mit 20 Knoten,
  Voraussetzungen, Stufenpips und Kosten – reine Daten in `config/skill-defs.js`.
- Zwei Währungen: Blut (Präzision, aus den Tanks) und Körperteile (alle anderen Äste),
  beide im HUD **und** im Skill-Screen. Freischalten neuer Gebäude über `unlock`.
- `fx` wirkt sofort, auch auf bereits gebaute Maschinen (`recomputeFx` → `S.fx`).

**Blut-Pipes und Reserve (`pipes.js`, `market.js`)**

- Frei verlegbare Rohre, Netzbildung über Tanks, Kapazitäten und Durchfluss, Saug-Anschlüsse.
- Blutmarkt mit Reserve pro Markt (absolut oder Prozent der Tankkapazität), Status
  „Reserve gehalten“, Speicherung im Spielstand.

**Start und Tutorial (`tutorial-defs.js`, `ui/ui.js`)**

- Startmenü „Tutorial spielen?“ mit Ja / Nein / Spielstand laden, Gore-Level-Auswahl.
- 12 Tutorialschritte als reine Daten: Highlight in der Bauliste, pulsierender Zielrahmen,
  Erklärung; nichts ist vorgebaut; Blutreserve-Schritt und Abschluss mit Startvorrat.
- Jederzeit überspringbar über den Button „Überspringen“ im HUD.

### Behobene Fehler

- Kamera-Culling: `viewCells`/`visibleRect` rechnen den sichtbaren Bereich zentriert um die
  Kamera – zuvor fehlte die linke/obere Bildhälfte der Ansicht.
- Blutentstehung landete weltweit auf der untersten Feldreihe statt unter der Quelle.
- Presse ließ Sticks zu früh los und tötete nicht im Takt.
- Klingenpresse zeigte bei Gore-Level 0 „-Kopf“-Texte, ohne etwas abzutrennen.
- „Mehrfachziele“ des Skill-Baums hatte keine Wirkung.

### Änderungen an bestehendem Code

- `renderer.js` komplett neu (Raster, Kamera, Culling, Ghost, Ports, Hinweise); die
  Clean-Tech-Optik bleibt.
- `ui.js` um Startmenü, Tutorial-Logik, Speicherstand **v9** und Kamera-Eingabe erweitert;
  `inspector.js` um Zielwahl, Trefferquote, Filterregel und Marktreserve.
- Aufträge, Forschungs-Panel, Stuhl-Pipeline, Gore-Level und Abschleuderer bleiben erhalten.
- Speicherstand: `bloodworks_v8` und älter werden verworfen, mit Toast-Hinweis im Spiel.

### Annahmen und Interpretationen

1. **Sichtansicht mit Schwerkraft** (statt Seitenansicht mit Etagen) – Raster + Fallgeschwindigkeit.
2. **Präzisions-Level** ist ein globaler Skill-Wert (`S.fx.hit`), nicht pro Maschine; der
   Inspektor zeigt die daraus folgende Trefferquote am Gerät an.
3. **Blut ohne Pipe** verhält sich wie bisher: Gerät direkt am Tank ohne Rohr nutzt den
   globalen Pool – das ist so beabsichtigt („Ohne Pipe verhält sich Blut wie bisher“).
4. **Reserve** bezieht sich auf die über Pipes verbundenen Tanks des Marktes; ohne Anzeige
   „Kein Tank-Anschluss“ im Inspektor.
5. **Skill-Screen pausiert** beim Öffnen und setzt bei, wer vorher lief; Panels schließen
   bei einem neuen Spiel.
6. **`prefers-reduced-motion`** reduziert Partikel, Staub und pulsierende Rahmen; die
   Maschinenanimation selbst bleibt (sie trägt den Spielzustand).
7. **Startgeld** (1.600 €) reicht für die Tutorial-Kette inklusive mehrerer Bänder, Rohre,
   Tank und Markt; der Rest wird durch Verkaufserlöse ergänzt.
8. **Alter Tutorial-Weg** (vorgebaute Kette) und Speicherstand v8 entfallen bewusst.
9. **Tests ohne Browser**: `npm test` läuft in purem Node; das DOM wird über einen Stub
   abgebildet, der nur echte `index.html`-IDs liefert. Für die finale Sichtprüfung bleibt
   `npm run dev` im Browser.

### Qualität

- `npm run check` = ESLint + 64 Vitest-Tests (7 Dateien) + Vite-Build, fehlerfrei.
- Tests: Platzierung/Locks/Undo, Bänder inkl. Lift und Fallverhalten, Maschinen inkl.
  Weiche/Filter/Presse/Mehrfachziele, Rohrnetze inkl. Reserve und Speicherung, Skill-Tree
  inkl. Währungen und Voraussetzungen, Simulation (volle Kette, Energie, Gore), UI-Smoke
  (lädt `src/main.js`, tickt Frames, klickt Buttons, Karten und Canvas-Platzierung).
