# Umbau overhaul-2

Gesamtziel: vier Pakete – Quests, Maschinen-Design, Animationen, UI – plus vorab eine
Dokumentationsphase. Ablauf je Phase: Umfang → Tests → `npm run check` → visuelle Prüfung
(Headless-Chrome + Screenshots) → Dokumentation (CHANGELOG + Abhaken) → Commit → Push
`origin overhaul-2` → Bericht → Stop bis OK. Merge nach `main` erst am Paketende und nur
mit explizitem OK.

## Regeln (unverändert)

- Vanilla JS, keine neuen Runtime-Dependencies.
- Modulrichtung `config/utils → core → render → ui → main`; Simulation ist die Wahrheit,
  `render`/`ui` lesen nur.
- `SAVE_VER` erhöhen und `migrate()` ergänzen, sobald sich das Speicherformat ändert.
- Alle sichtbaren Texte deutsch, keine Emojis, selbst erzeugte Assets.
- Bei Unklarheiten sinnvolle Annahme treffen und im CHANGELOG dokumentieren.

## Paket 0 – Dokumentation (Version 0.10.0)

- [x] Phase 0: Code-Audit aller vier Pakete, Bericht, Stop auf OK.
- [ ] `docs/PLAN.md` anlegen (diese Datei) und Phase 0 abhaken.
- [ ] `README.md`: aktueller Stand (93 Tests, Palette/Icons/Tooltip, overhaul-2-Workflow).
- [ ] `docs/ARCHITECTURE.md`: palette/icons/tooltip/Diagonalbänder/Dirty-Rect nachtragen.
- [ ] `npm run check`, visuelle Prüfung, CHANGELOG-Eintrag 0.10.0, Commit, Push.

## Paket 1 – Quests (Version 0.11.0)

- [ ] Metriken in `S.stats` umziehen (statt Einzelfelder auf `S`), `migrate()`.
- [ ] Neue Metriken: Körperteil-Verkäufe, Asche, Bandzellen usw.
- [ ] Auftrags-Log statt reiner Statuskarte (`ui/quests.js`).
- [ ] Metrik `schleuder` von Gebäudezählung auf Ereignis umstellen.
- [ ] Tests: Quest-Konsistenz (jede Quest hat eine existierende Metrik, Ziele erreichbar).
- [ ] Visuelle Prüfung: Quest-Panel, Fortschritt, Abschluss-Toast.

## Paket 2 – Maschinen-Design (Version 0.12.0)

- [ ] Footprints vergrößern (Walze 3×2, Presse 2×3, Klingenpresse 3×3, Abschleuderer 4×2,
      Ofen 3×3, Säure 4×2, Tank 2×4, Generator 3×2, Markt 3×3, Verkauf 3×2) – Reihenfolge:
      zuerst reine Geometrie, dann Zeichnung.
- [ ] `src/render/machines/*.js` anlegen, `drawMachineBody` auf Module aufteilen.
- [ ] Sticks in Maschinen sichtbar machen (Position/Größe über Footprint).
- [ ] Ports an neuen Footprints prüfen (`originOf`, `compsOf`, Feed-Regeln).
- [ ] Alte Test-Koordinaten anpassen (`machines`, `pipes`, `simulation`).
- [ ] Save-Entscheidung: `SAVE_VER` 10 + Migration oder dokumentierter Reset.
- [ ] Visuelle Prüfung: Halle mit allen Maschinen, Warenfluss, Port-Pfeile.

## Paket 3 – Animationen (Version 0.13.0)

- [ ] `src/render/anim/poses.js` (Datenmodule, kein Zustand schreiben).
- [ ] Posen: Walze, Pressen-Hub, Klingen-Schlag, Abschleuderer-Schwung.
- [ ] Pose-Tests (Struktur, Periodizität) ohne Canvas.
- [ ] `prefers-reduced-motion` respektiert Animationen.
- [ ] Visuelle Prüfung: laufende Maschinen, reduzierte Bewegung.

## Paket 4 – UI (Version 0.14.0)

- [ ] Palette um Maße-Tokens erweitern (`--sp*`, `--r*`, `--shadow*`, `--font*`, `--dur*`).
- [ ] Panels/Buttons auf Tokens umstellen.
- [ ] Optische Anmutung: Hallenrahmen, Typo, Bau-Leiste (Screenshots entscheiden).
- [ ] Dev-Seiten `?ui` / `?gallery` hinter Query-Param.
- [ ] Visuelle Prüfung: Gesamtansicht, Forschung, Inspektor,/mobile Ansicht.

## Offene Risiken

- Maschinen-Footprints brechen feste Koordinaten in Tests und evtl. alte Spielstände.
- `tests/dom-stub.js` kennt nur IDs aus `index.html` – neue DOM-IDs brauchen einen Guard.
- Visuelle Prüfung per Headless-Chrome ist zwingend, nicht nur Unit-Tests.
