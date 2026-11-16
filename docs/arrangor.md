# For arrangørene

Hvordan julekalenderen slippes og vedlikeholdes. Hele planen og beslutningene
står i [utviklingsplan.md](utviklingsplan.md).

## Oppsettøkt 27. november

### Arrangør: før deltakerne kommer

- [ ] Velg og dokumenter hvem som eier fellesprosjektet, hvem som kan slette
  deltakerdata, og når dataene skal slettes. Avklar samtykke og avmelding
  før virkelig deling åpnes. **Blokkering:** Tekst ved navnefeltet som sier
  at navn og figur deles er ikke bygget ennå (oppstartsdelen).
- [ ] Kontroller `production`-dataset i fellesprosjektet. Et separat `test`-
  dataset er anbefalt for videre utprøving, men er ikke opprettet ennå;
  det krever en konto med Developer/Admin-rettigheter. Ikke skriv
  tilfeldige testdata i production: en avgrenset test med midlertidig
  profil og etterfølgende sletting ble gjennomført 16. november etter
  særskilt klarsignal. Datasetets synlighet må
  ikke endres for spillet: serveren leser med sitt eget token og
  `perspective=published`. Kontroll 16. november: prosjektet oppgir
  `production` som offentlig, men anonyme spørringer ser ikke
  fellesprofilene som tokenbaserte spørringer ser.
- [ ] Lag et eget Sanity-token med skrivetilgang til fellesprosjektet. Lagre
  det **bare** i miljøvariablene på arrangørens Vercel-deployment, aldri
  i deltakernes kloner eller i `NEXT_PUBLIC_*`.
- [ ] Deploy samme repo på Vercel. Sett `COMMUNITY_SANITY_PROJECT_ID`,
  `COMMUNITY_SANITY_DATASET=production`, `COMMUNITY_SANITY_TOKEN` og
  `COMMUNITY_WRITES_ENABLED=1` **på arrangørserveren**. Kontroller at
  `GET /api/community` svarer med `configured: true` og
  `publishing: true`, og at ingen token finnes i nettleserens ressurser.
  For prøve-deployment: bruk `COMMUNITY_SANITY_DATASET=test` når et eget
  testdataset finnes. Ikke slå på deltakerskriving i production før
  samtykke og sletting er avklart.
- [ ] Serverens CORS åpner `http://localhost:3000` og `:3001` som standard.
  Legg andre **eksakte** origins (inkludert eventuell Codespaces-URL) i
  `COMMUNITY_ALLOWED_ORIGINS` som kommaseparert liste på Vercel. Test
  `OPTIONS` og `GET` fra deltakerens faktiske origin. CORS er ikke
  autentisering; serveren har bare en enkel grense på 30 forespørsler per
  minutt/IP og Vercel må få en plattformdekkende rate limit før åpen
  lansering. Klientmeldt fullføring er fortsatt ikke kontrollert av
  serveren; ikke bruk fellespoeng til premier eller konkurranse.
- [ ] Prøv én fersk klone på kontornett (og Windows/Codespaces): `npm install`,
  `npm run setup`, `npm run dev`, innlogging på `/studio`, publiser et
  våpen og se det i `/api/items`. Prøv arkiv-seeding og `/api/archive` på
  **eget** prosjekt uten å overskrive redigerte dokumenter.

### Deltaker: på økta

- [ ] Klon repoet og installer Node.js 22.12+ og avhengighetene med
  `npm install`. Kjør `npm run setup` for ditt **eget** Sanity-prosjekt,
  eller `npm run setup -- --project <id>` for et du allerede eier.
- [ ] Claim nyopprettet prosjekt innen 72 timer. Hold claim-lenke og
  eventuell `SANITY_AUTH_TOKEN` privat. Logg inn i Studio via lenken
  fra setup; etter claim: logg inn med Sanity CLI, fjern gamle
  claim-verdier og tilbakekall midlertidig token ved behov.
- [ ] Kontroller at eget dataset er offentlig lesbart for publisert innhold.
  Kjør `npm run setup -- --cors` etter claim slik at ditt Studio får
  `localhost:3000` og `:3001` med credentials. Velg samme port som ved
  testing; en annen port må legges til separat.
- [ ] Sett `NEXT_PUBLIC_COMMUNITY_URL` i gitignorert `.env.local` til
  arrangørens **hele** HTTPS-adresse som slutter på `/api/community`.
  Ingen felles token eller prosjekt-ID trengs hos deg. Start `npm run dev`
  på nytt etter endring i `.env.local`.
- [ ] Åpne spillet og `/studio` på samme localhost-port. Publiser et våpen,
  se det i inventaret, og sjekk at «Hvem er med» henter fra arrangørens
  server. Lag figur og velg spor når den samlede oppstartsflyten er klar.
  Dersom fellesskapet er nede, kan du fortsatt spille alene.

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
så luke 3 (validation) kan teste duplikater mot datasettet ditt (publiser minst én
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
  åpner kapittel 1 tirsdag 1. desember og de neste kapitlene på mandagene
  etter (7. og 14. desember). Uten den er alt åpent.
- `?dev` på adressen viser **utviklerpanelet** og åpner alle oppdrag uansett rekkefølge og dato: hopp til et oppdrag, fullfør et oppdrag med ett klikk, les alle stegene, lat som en kodesjekk er bestått, spill av effekter, se om sanntid lytter eller sjekker. Sjekklista for en gjennomspilling ligger i [gjennomspilling.md](gjennomspilling.md).
- «Reset progress» nederst i questloggen (J) nullstiller fremgangen i nettleseren.
- Spill selv fra en egen klone, ikke i utviklingsmappa, så løsningene dine ikke
  havner på `main`. Kopier `.env.local` dit for å bruke samme Sanity-prosjekt.
