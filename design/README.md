# Designkladder

Kopier av arbeid som ellers bare lå i en midlertidig mappe eller i en
Claude-artifact på én konto. Ikke en del av spillet.

| Mappe | Hva |
|---|---|
| `figur/` | Prototype for egne figurer i lag (`python3 figur.py` lager `preview.png` og `idle.gif`) |
| `skisser/canvas/` | Kildefilene til konseptskissene i Claude Design. Bildene i dem peker på `/_blob/...` og vises bare i artifacten |
| `skisser/assets/` | Bildeutsnittene som ble lastet opp til skissene |
| `skisser/*.py` | Skriptene som genererte skissene |
| `notat/` | Gjennomføringsnotatet (HTML) |

**Nytt canvas med bare det vi beholdt** (`skisser/ny-canvas/`): ni tavler
om lista per uke, julekuler og figurer, uten luker, lys og poeng. Bygges med
`python3 skisser/ny_canvas.py`. Slik publiseres det på en ny konto:

1. Lag et nytt design-canvas.
2. `python3 skisser/remap.py` viser hvilke bilder i `skisser/assets/` som
   må lastes opp (8 stykker).
3. Skriv de nye id-ene i en fil (`<fil> <ny id>` per linje) og kjør
   `python3 skisser/remap.py <filen>`.
4. Publiser `skisser/ny-canvas/project/`.

`skisser/canvas/` er hele det gamle canvaset, til referanse.
`blob-map.txt` sier hvilket bilde hver gammel id var.

Artifactene på claude.ai (skissene og notatet) eies av kontoen de ble laget
på. Del dem fra Share-menyen hvis en annen konto skal åpne dem.
