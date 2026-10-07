# BloodWorks: Stick Factory

Browserbasiertes Fabrik-Simulationsspiel (Vite, Vanilla JS, Canvas).

## Start

```bash
npm install
npm run dev       # Entwicklungsserver mit Hot Reload
npm run build     # Produktions-Build nach dist/
npm run preview   # Build lokal ansehen
npm test          # Tests
npm run lint      # ESLint
npm run format    # Prettier
npm run check     # Lint + Tests + Build
```

Benötigt Node.js ≥ 20. Der Build in `dist/` kann auf jeden statischen Webspace hochgeladen werden.

## Steuerung

Leertaste Start/Pause · 1/2/3 Kategorie · Rechtsklick/Esc Abbrechen · Entf Verkaufen · E An/Aus · Strg/Cmd+Z Undo.

## Features

- **Stuhl-Pipeline:** Der Eingang setzt Sticks auf Stühle, die permanent sitzend mit dem Band fahren. Lücken reißen sie dynamisch ab und schleudern sie in den Keller; der **Abschleuderer** wirft sie mitsamt Stuhl vom Band.
- **Anatomie:** Sticks verlieren abtrennbare Gliedmaßen (Gore-Level 0/50/100), bluten tropfenweise und landen als Leichen im Keller.
- **Forschung:** Blutinvestitionen in Bandantrieb, Marktkenntnis, Nachschub und Tanksystem.
- **Aufträge:** Feste Quest-Kette von der ersten Beute bis zum Serienausstoß – Belohnungen in Geld.
- **Echte Warenflüsse:** Container leeren Blut auf den Boden, Abfluss/Markt/Generator brauchen Tank-Anschluss, Ofen/Säure ziehen aus dem Container. Auslastung steuert den Energieverbrauch.
- **Geräte-Panel:** Status, Auslastung, Durchsatz, Verbindung und An/Aus pro Maschine.
- **Clean-Tech-Design:** helle Laborhallen mit Chrom-Schienen, blaue LED-Akzente und animierte Blutrohre.

Aufbau und Erweiterung: siehe [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
