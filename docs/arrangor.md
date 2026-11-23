# For arrangørene

Hvordan julekalenderen slippes og vedlikeholdes. Hele planen og beslutningene
står i [utviklingsplan.md](utviklingsplan.md).

## Oppsettøkt 27. november

### Arrangør: før deltakerne kommer

- [ ] Velg og dokumenter hvem som eier fellesprosjektet, hvem som kan slette
      deltakerdata, og når dataene skal slettes. Avklar samtykke og avmelding
      før virkelig deling åpnes. Figurarket sier ved «Vis for andre» at navn
      og figur deles, og ingenting deles før deltakeren sier ja.
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
- [ ] Sett adressen til den publiserte serveren i `src/game/release.ts`
      (`RELEASE_COMMUNITY_URL`, hele adressen som slutter på
      `/api/community`), og sjekk startdatoen (`RELEASE_CALENDAR_START`).
      Deltakerne får begge med `git pull`; ingen trenger å endre `.env.local`.
      `npm run verify-release` stopper hvis adressen mangler.
- [ ] Prøv én fersk klone på kontornett (og Windows/Codespaces): `npm install`,
      `npm run setup`, `npm run dev`, og følg «Oppsett» i spillet til alt er
      grønt. Publiser et våpen og se det i spillet.

### Deltaker: på økta

- [ ] Klon repoet og installer Node.js 22.12+ og avhengighetene med
      `npm install`. Kjør `npm run setup` for ditt **eget** Sanity-prosjekt,
      eller `npm run setup -- --project <id>` for et du allerede eier.
- [ ] Kjør `npm run dev` og åpne http://localhost:3000. Følg **Oppsett**
      øverst til høyre til alt er grønt: logg inn i Studio (trykk «Sanity
      Studio», så logger spillet deg inn), og gjør prosjektet til ditt
      (*claim*) med knappen der. Etter claim logger Studio deg ut, og du logger
      inn igjen med kontoen din. Hold claim-lenken og `.env.local` private.
- [ ] Velg løype, lag figuren, publiser et våpen og se det i spillet. Sjekk at
      «Hvem er med» henter fra arrangørens server. Dersom fellesskapet er
      nede, kan du fortsatt spille alene.

### Hvis en deltaker står fast

- **Oppsett** i spillet sier hva som er galt og hvordan det fikses. Be om et
  skjermbilde av den først.
- `npm run setup` kan kjøres på nytt og viser hvilket prosjekt deltakeren er
  koblet til, og om det er claimet.
- **Ikke claimet i tide:** `npm run setup -- --new` lager et nytt prosjekt.
  Lukene deltakeren har klart, blir med; innhold i Studio må lages på nytt.
- README har en tabell over de vanligste problemene.

## Hva spillerne kloner

`main` er det spillerne kloner. All koding i den tekniske løypa skjer i
kodevinduet i spillet, så spillerne endrer ikke filer i repoet, og `git pull`
gir ingen konflikter. Når en kodeoppgave er løst, slår Studio på vår egen
versjon av samme kode (`src/sanity/lib/solved.tsx`).

Den gamle `solutions`-grenen og `solution/*`-taggene er fra da oppgavene ble
løst i repoet. De brukes ikke lenger. Ikke push dem.

## Kontroll før lansering

```bash
npm run verify-release              # typecheck, skjemasjekk og tester
npm run verify-release -- --build   # også en ren npm ci og next build
```

Den sjekker ut `main` i en midlertidig worktree, slik en spiller får den, så
din egen arbeidskopi blir ikke rørt.

## Slippe en rettelse eller en ny luke

1. Lag endringen på en gren, med tester (`npm test`), og merg til `main`.
2. `npm run verify-release -- --build`.
3. Post i kanalen at deltakerne skal kjøre `git pull` og starte spillet på
   nytt.

## Kalender og testing

- `RELEASE_CALENDAR_START` i `src/game/release.ts` (nå `2026-12-01`) åpner
  uke 1 tirsdag 1. desember og de neste ukene på mandagene etter (7. og 14.
  desember). `NEXT_PUBLIC_CALENDAR_START` i `.env.local` overstyrer den;
  tom verdi åpner alt.
- Når `RELEASE_COMMUNITY_URL` er satt, sender også din lokale kopi framgang
  til den publiserte serveren. Bruk `?dev` (sender ingenting), eller sett
  `NEXT_PUBLIC_COMMUNITY_URL=/api/community` i `.env.local` for å bruke din
  lokale server.
- `?dev` på adressen viser **utviklerpanelet** og åpner alle oppdrag uansett rekkefølge og dato: hopp til et oppdrag, fullfør et oppdrag med ett klikk, les alle stegene, lat som en sjekk er bestått, spill av effekter, se om sanntid lytter eller sjekker. Sjekklista for en gjennomspilling ligger i [gjennomspilling.md](gjennomspilling.md).
- «Reset progress» nederst i questloggen (J) nullstiller fremgangen i nettleseren.
- Spill selv fra en egen klone, ikke i utviklingsmappa, så du ser det samme
  som deltakerne. Kopier `.env.local` dit for å bruke samme Sanity-prosjekt.
