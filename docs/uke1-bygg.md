# Bygg uke 1 ferdig

Plan fra 4. november 2026. Uke 1, «Tilpass Studio», er bestemt: oppvarming,
tre oppgaver og to bonuser. Her står hva som må bygges, og hvilke byggeklosser
vi lager så de neste ukene kan gjenbruke dem.

## Prinsipp

Kjerneoppgavene løses i kodevinduet i spillet. Den som vil gå videre, gjør det
i selve koden i repoet. Bonusene skrives i repoet fra start.

## Oppgavene

| Luke | Oppgave | Hvor | Sjekkes av | Status |
|---|---|---|---|---|
| 1 | Oppvarming: lag og publiser et våpen | Studio | Spillet | Virker. Mangler meldingen «Du har et utkast som ikke er publisert» |
| 2 | Ikon og preview | Kodevinduet | Vinduet | Virker (prototype) |
| 3 | Regler for våpen (*validation*) | Kodevinduet | Vinduet | Flyttes fra repoet til vinduet |
| 4 ☆ | Velg sprite med bilder (*custom input*) | Repoet | `npm run quest` | Finnes. Må prøves mot løsningen |
| 5 ☆ | Se våpenet i Studio (*document view*) | Repoet | `npm run quest` | Finnes. Må prøves mot løsningen |
| 6 | Smi-knapp (*document action*) | | | Flyttes til uke 3 |

## Byggeklossene

1. **Kodevindu-oppgave.** Én fil per oppgave i `src/components/hud/codeWindow/tasks/`,
   med startkode, tillatte `import`-er, eksempeldokumenter, sjekk, vår versjon,
   filer man kan lese, og hvor i repoet man går videre. Vinduet selv vet ingenting
   om den enkelte oppgaven.
2. **Bryteren i Studio.** Vår versjon av koden ligger i repoet og slås på når
   oppgaven er løst i vinduet (`src/sanity/lib/solved.tsx`). Det virker for
   React (`useSolved`) og for vanlige funksjoner som *validation* (`isSolved`).
3. **Gå videre i koden.** Etter at en oppgave er løst, viser vinduet fila og
   `QUEST`-kommentaren i repoet, og et forslag til hva man kan gjøre videre der.
4. **Falsk klient.** Oppgaver som trenger *dataset*-et, får en
   `context.getClient()` i vinduet som svarer fra eksempeldokumentene.
5. **Bonus på oppgavekortet.** En `bonus`-markering på oppgaven, så lista viser
   den som valgfri (☆).
6. **Sjekk i repoet** (`npm run quest`) og **sjekk fra innhold** (spillet) finnes
   allerede.

## Rekkefølge

1. Byggeklossene 1, 2, 3 og 5, og Smi-knappen flyttet. Samtidig: utkast-meldingen
   for luke 1, og bonusene prøvd mot løsningene.
2. Luke 3 i kodevinduet, med falsk klient.
3. Gjennomspilling av hele uka i nettleseren, og løsningene skrevet om
   (`solution/*`-taggene pushes aldri).
