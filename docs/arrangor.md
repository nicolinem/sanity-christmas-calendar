# For arrangørene

Hvordan julekalenderen slippes og vedlikeholdes. Hele planen og beslutningene
står i [utviklingsplan.md](utviklingsplan.md).

## Grener

- **`main`** er det spillerne kloner: spillet og spillerfilene i *startform*
  (uløste, med `QUEST:`-kommentarer). Ingen løsninger her.
- **`solutions`** følger `main` og har én commit per kode-quest, tagget
  `solution/<quest-id>`. Grenen og taggene pushes ikke til det felles repoet
  før løsningen skal slippes. Spillerne ser en løsning med
  `git show solution/<quest-id>` (akkurat den questens commit; `git diff main …`
  ville også vist senere endringer på `main`).

Spillerfiler (spilleren eier dem): `src/sanity/schemaTypes/**`,
`sanity.config.ts`, `src/sanity/studio/**`. Etter lansering endrer vi dem
aldri på `main`, ellers får spillerne konflikter ved `git pull`. Nye kapitler
legger til nye filer (spillkode, hjelpere i `src/sanity/lib/`, sjekker i
`scripts/quest.ts`).

## Kontroll før lansering

```bash
npm run verify-release          # typecheck, skjemasjekk og quest-sjekker på begge grenene
npm run verify-release -- --build   # også next build
```

Den sjekker ut `main` og `solutions` i midlertidige worktrees, så din egen
arbeidskopi blir ikke rørt. Den feiler hvis en kode-quest er løst på `main`
(en løsning har lekket) eller ikke er løst på `solutions`. Bruker `.env.local`,
så Laugets lov kan teste duplikater mot datasettet ditt (publiser minst én
gjenstand først).

## Slippe et kapittel

1. Bygg kapitlet på `main`: quester i `src/game/quests/chapters.ts`, sjekker i
   `scripts/quest.ts`, hjelpere i `src/sanity/lib/`. Startform for nye
   spillerfiler, med `QUEST:`-kommentarer.
2. `git checkout solutions && git merge main`, skriv én løsning per quest:
   én commit og `git tag solution/<quest-id>` for hver.
3. `npm run verify-release`.
4. Push `main`. Kapitlet åpner på datoen.
5. Dagen etter: `git push origin solution/<quest-id>` for kapitlets quester.

## Kalender og testing

- `NEXT_PUBLIC_CALENDAR_START=2026-12-01` i `.env.local` (eller i hostingen)
  åpner kapittel N på dag 1 + (N−1) uker. Uten den er alt åpent.
- `?dev=quests` på adressen åpner alle quester uansett rekkefølge og dato.
- «Reset progress» nederst i questloggen (J) nullstiller fremgangen i nettleseren.
- Spill selv fra en egen klone, ikke i utviklingsmappa, så løsningene dine ikke
  havner på `main`. Kopier `.env.local` dit for å bruke samme Sanity-prosjekt.
