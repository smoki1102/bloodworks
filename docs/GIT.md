# Git

Repo: `https://github.com/smoki1102/bloodworks` (privat) · Branch: `main`

## Tagesgeschäft

```bash
git status -sb              # was hat sich geändert?
git diff                    # Änderungen im Working Tree
git diff --staged           # Änderungen im Index (nach git add)
git add -A                  # alles aufnehmen
git add src/core/simulation.js   # nur eine Datei aufnehmen
git commit -m "Kurze Nachricht"   # committen
git push                    # zu GitHub
git pull                    # von GitHub holen (vor dem Arbeiten)
git log --oneline -10       # Verlauf
git show                    # letzten Commit ansehen
```

## Wenn etwas schiefging

```bash
git restore <datei>         # Änderungen an einer Datei verwerfen
git restore --staged <datei>   # aus dem Index nehmen, Datei bleibt
git reset --soft HEAD~1     # letzten Commit rückgängig, Änderungen bleiben
git reset --hard HEAD~1     # letzten Commit rückgängig, Änderungen weg (Vorsicht!)
git stash                   # Änderungen vorübergehend weglegen
git stash pop               # wieder holen
```

## Branches

```bash
git switch -c feature/xyz   # neuen Branch erstellen und wechseln
git switch main             # zurück zu main
git merge feature/xyz       # Branch zusammenführen
git branch -d feature/xyz   # Branch löschen (zusammengeführt)
git push -u origin feature/xyz   # Branch zum ersten Mal pushen
```

## Auf GitHub

```bash
gh repo view                # Repo-Infos
gh repo view --web          # im Browser öffnen
gh pr create --fill         # Pull Request erstellen
gh pr list                  # offene PRs
gh pr checks                # CI-Status
gh issue list               # Issues
gh auth status              # angemeldet?
```

## Verworfene Arbeit wiederfinden

```bash
git reflog                  # alle letzten HEAD-Positionen
git restore --source=<sha> <datei>   # einzelne Datei aus einem alten Stand holen
```

## Hinweise

- Vor jeder Arbeit `git pull`, danach `git push`.
- Nie Commits direkt auf `main`, wenn andere daran arbeiten → Branch + PR.
- `node_modules/`, `dist/`, `.DS_Store` sind via `.gitignore` ausgeschlossen.
- Geheimnisse niemals committen (`.env`, Tokens, Keys).
