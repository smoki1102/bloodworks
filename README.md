# BloodWorks: Stick Factory

Browserbasiertes Fabrik-Simulationsspiel (Vite, Vanilla JS, Canvas).

## Start

```bash
npm install
npm run dev       # Entwicklungsserver mit Hot Reload
npm run build     # Produktions-Build nach dist/
npm run preview   # Build lokal ansehen
npm test          # Tests (Vitest, tests/)
npm run lint      # ESLint
npm run format    # Prettier
npm run check     # Lint + Tests + Build
```

Benötigt Node.js ≥ 20. Der Build in `dist/` kann auf jeden statischen Webspace hochgeladen werden.

## Steuerung

| Eingabe                 | Wirkung                                            |
| ----------------------- | -------------------------------------------------- |
| Maus links              | Bauen (Werkzeug), Band: Start- und Endpunkt, Inspektor |
| Maus rechts / Esc       | Werkzeug abwählen                                  |
| Maus mittel / Leertaste | Verschieben (Pan) / Start-Pause                    |
| Rad                     | Zoomen an der Maus                                 |
| Pfeiltasten / ±         | Kamera verschieben / zoomen                        |
| 1–5                     | Bautaste: Bänder, Maschinen, Logistik, Rohre, Handel |
| R                       | Baustein um 90° drehen                             |
| E                       | Gewähltes Gerät an/aus                             |
| Entf                    | Gewähltes Gerät verkaufen                          |
| Strg/Cmd+Z              | Rückgängig                                         |
| K                       | Forschung öffnen: Skill-Netz & Upgrades (pausiert) |

## Features

- **Freie Bauwelt:** eine Halle auf einem Raster (128 × 64 Zellen), überall baubar.
  Kamera frei verschiebbar und zoombar; große Anlagen bleiben durch die zentrierte
  Ansicht vollständig sichtbar.
- **Förderband als Strecke:** Werkzeug wählen, auf die **Startzelle** klicken, dann auf die
  **Zielzelle** – die Strecke zieht sich in echten 45°-Diagonalen mit geradem Rest, kostet
  pro Zelle und ist mit einem Befehl rückgängig zu machen. Bestehende Bandzellen werden
  übernommen, Maschinen oder die Weltkante stoppen den ganzen Pfad. Waren fallen ohne Band
  nach unten und verrotten auf dem Boden.
- **Sticks mit Körperteilen:** Kopf, Torso, Arme, Beine mit Lebenspunkten; Maschinen
  verursachen Teilschaden, der Stick läuft weiter, bis Kopf/Torso weg sind oder die LP
  auf 0 fallen. Abgetrennte Teile sind eigene Waren (Behälter, Verbrenner, Säurebad, Verkauf)
  und fließen automatisch in den Körperteil-Vorrat.
- **Werkzeug- und Sortierketten:** Spikes-Walze, Presse, **Presse mit Klingen**,
  Abschleuderer, **Weiche**, **Zusammenführung** und **Filter** leiten Waren gezielt zu
  Verkauf, Verbrenner, Säurebad oder Behälter.
- **Gezielte Treffer:** Im Inspektor jede Schneidemaschine wählt man das Zielkörperteil;
  die Trefferquote (45 % + Skill) wird mit angezeigt.
- **Forschung (Skill-Netz & Upgrades):** ein großes Fenster über der Halle, geöffnet per
  HUD-Button oder `K`, pausiert das Spiel. Reiter **Skill-Netz**: Sechs Äste als Diagramm
  mit Knoten und Verbindungslinien – **Präzision** kostet Blut aus den Tanks, alle anderen
  Äste kosten abgetrennte Körperteile; gesperrt/verfügbar/gekauft sind klar unterscheidbar,
  Voraussetzungen und Kosten stehen direkt am Knoten, Wirkung sofort, auch für gebaute
  Maschinen. Reiter **Upgrades**: bestehende Forschungsumfragen mit Blut und Körperteilen.
  Die Knoten rasten in Spalten (Voraussetzungstiefe) und Unterzeilen ein – nichts
  überlappt, Kanten zeigen immer den echten Vorgänger; bei Bedarf scrollt das Fenster.
- **Blut-Pipes und Netze:** frei verlegbare Rohre, Tanks und Geräte bilden Netze mit eigener
  Kapazität. Steht eine nutzbare Absaugung (Pipe-Zelle mit Tank, orthogonal neben Band oder
  Maschine), saugt das Blut ins Netz, statt vom Band zu tropfen – der Inspektor zeigt
  „Absaugung: Verbunden“. Ohne Anschluss tropft das Blut wie bisher auf den Boden; ohne Pipe
  gilt weiterhin der globale Blutpool.
- **Blutmarkt mit Reserve:** pro Markt einstellbar (absolut oder als Anteil der Tankkapazität);
  verkauft nur oberhalb der Reserve, zeigt „Reserve gehalten“ und schützt so den Generator.
- **Start und Tutorial:** Startmenü „Tutorial spielen? Ja / Nein / Spielstand laden“.
  Im Tutorial ist nichts vorgebaut – man baut die komplette Kette selbst, jeder Schritt
  markiert Item, Zielzelle und Begründung; jederzeit überspringbar. Am Ende gibt es einen
  Startvorrat an Blut und Körperteilen für den ersten Skill-Knoten.
- **Aufträge:** neun feste Aufträge (Kills, Fänge, Verkäufe, Abschleuderer-Würfe, Abwürfe,
  Schalter, Teilehandel, Forschung, Gesamtausstoß) als Karte mit Fortschrittsbalken und
  Auftrags-Log; Zähler liegen zentral in `S.stats`.
- **Eigenes Icon-Set:** 27 handgezeichnete 16×16-Vektor-Icons (Canvas und Inline-SVG),
  keine Emojis und keine Fremd-Assets.
- **Einheitliches Farbsystem:** `src/config/palette.js` ist die einzige Farbquelle;
  `applyTokens()` schreibt sie beim Start auf `:root`. Dunkles Anthrazit mit gedämpftem
  Gelb-Grün als Aktionsfarbe, Blut-Rot als einziger Akzent.
- **Bodenmuster:** Hallenboden mit Diagonalbändern und feinem Raster, damit Bewegung
  und Geschwindigkeit auf dem Band ablesbar sind.
- **Speicherstand v10:** Spielzähler in `S.stats`; alte Stände (v8 und älter) werden
  verworfen mit Hinweis im Spiel, v9 wird automatisch migriert.
- **Qualität:** 101 Vitest-Tests, `npm run check` (Lint + Tests + Build) fehlerfrei,
  `prefers-reduced-motion` respektiert (Partikel und Pulse werden reduziert).

Aufbau und Erweiterung: siehe [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
Änderungsverlauf: siehe [docs/CHANGELOG.md](docs/CHANGELOG.md).
Umbauplan overhaul-2: siehe [docs/PLAN.md](docs/PLAN.md).
