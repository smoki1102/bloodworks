# Changelog

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
