# Utviklingsplan: Sanity Winter Quest

Levende dokument. Oppdateres når faser blir ferdige eller beslutninger endres.
Forslaget til quester, kalender og gjennomføring står i [questplan.md](questplan.md).

## Prinsipper (gjelder alle faser)

1. **Sanity beskriver, spillet avgjør.** Innhold sier _hva_ noe er (navn, type, sprite). Det finnes **ingen tall å fylle inn** i Studio: skade, HP, elementbonus og hvilke sprites som finnes, ligger i spillkoden. Monstre får for eksempel type og størrelse, ikke HP.
2. **Ett Sanity-prosjekt per spiller.** Spillet leser bare publisert innhold. Deling skjer ved at noe leser fra alles prosjekter, aldri ved felles redigering.
3. **Bevisste feil, ingen tilfeldige.** Startmodellen er ryddig, bortsett fra det en quest skal lære spilleren å fikse.
4. **Quester sier _hva_, ikke _hvordan_.** Tips kommer lagvis: questtekst → Learn-lenke → automatisk sjekk med forklaring → fasit når den er sluppet. `npm run quest` er reserve for kodeoppgaver som ikke kan sjekkes trygt automatisk.
5. **Ingen mekanikk før spilleren har møtt den.** En quest kan bare bygge på noe spilleren har sett i spillet (Laugets lov kom før navnemagi var introdusert, og ble flyttet). Hver quest har en «Where to work»-linje (fil eller sted, ikke svaret), og kode-quester sier hvordan de sjekkes.
6. **Hver fase kan sendes for seg.** Etter hver fase: `tsc`, lint, build og en sjekk i nettleseren på 1280×720, 1440×900, 1920×1080 og mobilbredde.
7. **Ingen dominerte valg.** Et felt i Studio skal bare finnes hvis valget betyr noe. Finnes det ett svar som alltid er best, er det ikke et valg.
8. **To løyper, én felles historie.** Teknisk og ikke-teknisk løype har egne oppgaver som gir synlig verdi og går mot samme finale. Den ikke-tekniske løypa krever ikke at deltakeren skriver kode.
9. **Sekvensiell progresjon.** Neste luke åpnes først når sjekken for den aktive luka er bestått. Hint og fasit hjelper deltakeren, men omgår ikke fullføringskravet. Hvis automatisk sjekk ikke er mulig, må oppgaven ha en tydelig alternativ godkjenning.
10. **Poeng for fullføring, ikke konkurranse.** Poeng og nivå vises i egen progresjon og, etter opt-in, deltakeroversikten. Ingen toppliste i første versjon; verdier/nivågrenser fastsettes etter testing. `?dev`-overstyring skal aldri publiseres som deltakerresultat.

## Beslutninger så langt

- **Produktretning (2026-11-09):** tre ukentlige kapitler, ikke 24 daglige luker. Valgt løype går gjennom lukene i rekkefølge; neste luke åpnes først når den aktive er fullført. Hint og fasit er hjelp, ikke en snarvei forbi sjekken. Det finnes en teknisk og en ikke-teknisk løype. Poeng er med. Felles fremgang vises i deltakeroversikt med figurer og utvalgte resultater; ingen krav om at bygda endrer lys/dekor for hver oppgave.
- **Uke 1 (2026-11-06):** custom input er kjerneoppgave i teknisk løype. Ikke-teknisk løype trenger et eget oppgavesett; det er ikke bare samme kodeoppgave med flere hint.

Avsnittene om gamle questnavn, smienivåbelønninger, luke-for-luke-implementasjon
og faser under er delvis historikk fra prototypen. Nye endringer følger
«Byggerekkefølge for produktet» nederst, og faseinnhold er med bare dersom det
støtter vedtatt sluttprodukt.

- **Enklere språk, tydelig julekalender** (2026-10-31): «Luke N» i stedet for oppdragsnavn, og ingen egne navn på steder og funksjoner i spillet. Luke N åpner N–1 dager etter `NEXT_PUBLIC_CALENDAR_START`. Avsnittene under er skrevet før dette og bruker fortsatt de gamle navnene. Gjeldende plan: [questplan.md](questplan.md).
- Navnemagi: **delvis skjulte ordlister**. Brann tipser om ild i starten, resten utforskes.
- Elementbonus er **liten** (×1,5 mot svakhet, ×0 mot immunitet). Mest for moro.
- **Ingen materialer og ingen skadetall** (besluttet 2026-10-23). Alle smidde våpen slår like hardt; styrken følger **smiens nivå** (4/6/8/10), som stiger når man fullfører quester. Det som skiller våpen, er **navnet og elementet**, og det betyr noe fordi fiender har ulike svakheter.
- Effekter bruker Kenney Tiny Dungeon: **62** hogg-streker (angrep), **60** sikte-hjørner (mål i rekkevidde), **61** treff-glimt. Alle hvite, fargelegges per element. Elementpartikler lages som 1-px partikler i elementfarge.
- Deling: «Wordle-deling» først, Byropet (Function → kanal) i kapittel 3, Frostkjempen som finale.

## Åpne spørsmål

- [x] Språk i spillet: **norsk** (besluttet 2026-10-27). Kode og skjemanavn er engelsk.
- [ ] Kalender: bekreft startdato og kapittelåpning på dato; rekkefølgen blant lukene i valgt løype er besluttet.
- [x] Planer: **Content Releases** er et enterprise-tillegg og kuttes. Scheduled drafts, Comments og Tasks er heller ikke på gratisplanen. **Functions** og **Agent Actions** er med på gratisplanen, men Agent Actions bruker AI-kreditter, så det blir bonus (sjekket 2026-10-29, se questplan.md).
- [ ] Får vi lov til å bruke en innkommende webhook i jobbkanalen (Byropet)?

---

## Omlegging av kapittel 1 (2026-10-27) ✅

Etter første gjennomspilling fra en fersk klone:

- **Kortere kapittel 1, et nytt Sanity-konsept per oppdrag:** Den knuste smia (publiser og test på frostdraugen, slått sammen med kampen) → Branns protokoll → Laugets lov → Spritevelgeren → Prøvestua → Smi-knappen. «Prøv bladet» og «Power in a Name» er fjernet.
- **Navnemagi er et skjult ekstra**, ikke et tema: elementet vises i verktøytips, draugen er svak mot ild, hemmelige ord virker, men ingen oppdrag krever det. Kan komme tilbake i kapittel 3 via Agent Actions (Skalden).
- **Laugets lov** er ren Sanity: alle våpen må ha en sprite (regel som ser på `context.document`), og ingen like navn (asynkron validering). `npm run quest` tester fire dokumenter, og fanger også `required()`.
- **Oppdrag må gis:** et oppdrag er _tilbudt_ til Brann har forklart det. Da viser oppdragslista bare «Noen venter ved smia», og det kan ikke fullføres før det er gitt.
- **Brann snakker i sider** (E blar), presenterer seg første gang, og reagerer på forrige oppdrag med lærdommen før neste.
- **Åpning:** én skjerm med tre linjer første gang, og et «gå»-hint til ridderen har tatt de første skrittene.
- **Lærdommer:** hvert oppdrag har en lærdom som vises når det er ferdig, og samles i **Branns bok** i oppdragsloggen.
- **Sanntid:** spillet lytter på Sanity (listener-API, uten token) og henter på nytt når noe publiseres. Et nytt våpen stiger opp av smia og flyr til ridderen, og et nytt `forgedAt`-stempel får smia til å blusse opp. Lytting krever CORS for origin: før prosjektet er overtatt gjelder det bare `localhost:3000`, ellers sjekker spillet hvert 4. sekund.
- **`KnightPreview`** (`src/components/KnightPreview.tsx`): ridderen som svinger spillerens våpen, ferdig til bruk i Prøvestua.
- **All spilltekst er på norsk**, også Studio-titler, meldingene fra `npm run quest` og oppsettsiden for Studio. README og terminalverktøyet `npm run setup` er fortsatt på engelsk.

## Fase 0: Rydd modellen ✅ (ferdig 2026-10-23)

Fjern fellene vi fant. Eksisterende funksjonalitet skal virke likt etterpå.

- `gameItem` → `item`. Gamle testdokumenter migreres ikke (ingen spillere har startet ennå).
- `kind`: `weapon | material | potion`. **`creature` fjernes** (monstre blir egen type i kapittel 2). Ingen standardverdi, så man må velge.
- `material` og `damage` er fjernet: spillet bestemmer skaden ut fra smiens nivå.
- `slug` er ikke lenger påkrevd, og **spørringen slutter å filtrere på slug** (bruk `_id`).
- `sprite`: nedtrekksliste fra sprite-registeret (blir visuell velger i en quest).
- Ny `src/game/rules.ts`: `FORGE_DAMAGE` per smienivå og `forgedPower(level)`.

**Ferdig når:** første quest fortsatt fullføres, auto-utrusting bruker reell skade, kamp bruker reell skade, og fallback-sprites virker.

**Gjort:** `item`-type (`name`, `kind`, `sprite`, `description`), `src/game/rules.ts` med smiens nivå (fast på 1 til fase 1). Første versjon hadde materialer med skadetak; de ble fjernet fordi valget var dominert (det sterkeste var alltid best). Bevisst utelatt til quester: navneregler i Studio og preview med bilde.

## Fase 1: Quest-motoren ✅ (ferdig 2026-10-23)

- `src/game/quests/`: hver quest har `id`, `chapter`, `giver`, `title`, `goal`, `hints[]` (lagvise), `learnUrl`, `unlock` (dato + forutsetning), `reward` (for eksempel et smienivå) og `check(ctx)` → `{ done, message }`.
- `ctx` inneholder hentet innhold, lokal fremgang (snakket med Brann, wraith beseiret) og resultater fra kodesjekker.
- Fremgang lagres i `localStorage` per prosjekt-ID. Den er personlig og trenger ingen server.
- Oppdragslisten viser aktivt kapittel. En **questlogg** (tast J) viser alle kapitler, der låste vises som en smakebit.
- Datostyring med `CALENDAR_START`, og `?dev` overstyrer under utvikling.
- Belønninger: hvert fullført kapittel (og den første seieren over wraith-en) hever **smiens nivå**, og alle våpnene dine blir sterkere sammen. `FORGE_LEVEL` i `GameClient` byttes ut med verdien fra fremgangen.

**Ferdig når:** kapittel 1-questene vises, åpnes i rekkefølge, gir belønning, og fremgangen tåler en reload.

**Gjort:**

- `src/game/quests/`: `types.ts`, `chapters.ts` (kapittel 1 med sju quester + navn på kapittel 2 og 3 som smakebit), `engine.ts` (rekkefølge, kalenderdatoer, smienivå), `progress.ts` (localStorage per prosjekt).
- Kapittel 1: Den knuste smia → Prøv bladet (beseir wraith-en, **+1 smienivå**) → Branns protokoll → Laugets lov → Spritevelgeren → Prøvestua → Smi-knappen (**+1 smienivå**). Quest 3–6 sjekkes fra koden; Smi-knappen sjekkes i data (`forgedAt`).
- Kodesjekker leses fra `.quest/results.json` via `/api/quest-checks` (gitignored). `npm run quest` som skriver fila, kommer i fase 3.
- HUD: tracker med aktiv quest og fremgang, questlogg (J) med lagvise hint og Learn-lenker, toasts for fullført quest og hetere smie, Brann deler ut quester med egen replikk, «!» over Brann når han har en ny oppgave.
- `NEXT_PUBLIC_CALENDAR_START=YYYY-MM-DD` slår på datoåpning (kapittel N åpner N−1 uker etter). Uten den er alt åpent. `?dev=quests` åpner alt for testing.

## Fase 2: Navnemagi (delvis gjort 2026-10-23)

**Allerede på plass:** `magic.ts` (gjenkjenning), elementet vises i verktøytips og i Branns vurdering, wraith-en er svak mot ild (×1,5) og immun mot frost (×0), og questen «Power in a Name» introduserer navnemagi med Branns ild-tips. **Gjenstår:** visuelle effekter (aura, Kenney 60/61/62), brannskade over tid, runeboka, hemmelige ord med egne sitater.

- `src/game/magic.ts`, uten avhengigheter, slik at Studio kan importere den senere:
  - Elementer: 🔥 ild, ❄ frost, ⚡ lyn, ☠ gift, ✨ lys.
  - Ordstammer på engelsk og norsk, normalisering (små bokstaver, æøå beholdes), match på starten av hvert ord.
  - Hemmelige ord (Surt, Muspel, Brann, Nifl, Ymir, Mjølner, Thor, Jormund, Balder) gir et eget sitat eller en ekstra effekt.
  - Maks ett element. Ild + frost = damp (fuser ut, +0). Negasjoner («Unburnt») tolkes bevisst _feil_, siden det er poenget i «Runene svikter» i kapittel 2.
- Kamp: ×1,5 mot svakhet, ×0 mot immunitet, og en liten brannskade over tid for ild. Frost Wraith: svak mot ild, immun mot frost.
- Visuelt i verden:
  - Partikkelaura i elementfarge rundt våpenet i ridderens hånd.
  - Kenney 62 (hogg) i elementfarge ved angrep.
  - Kenney 60 (sikte) rundt wraith-en når den er innen rekkevidde.
  - Kenney 61 som treff-glimt.
  - Skadetall i elementfarge, og «Svak!» / «Immun» over fienden.
- HUD: elementmerke i verktøytips og kampstripe.
- **Runeboka** i questloggen samler ord man har oppdaget. Uoppdagede vises som «???» med antall per element.
- Brann tipser om ild første gang: _«De gamle smedene sa at navn som taler om flamme, biter dypere.»_

**Ferdig når:** «Flaming Sword» gir ild-effekt og bonus mot wraith-en, frost gir «Immun», og runeboka fylles.

## Fase 3: Kapittel 1 – Smia

| #   | Quest             | Konsept                                                                                                                                                     | Sjekkes av                                              |
| --- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 1   | Den knuste smia   | Publisering                                                                                                                                                 | Spillet (GROQ)                                          |
| 1b  | Prøv bladet       | Kamp (ingen Sanity)                                                                                                                                         | Spillet                                                 |
| 1c  | Power in a Name   | Navnemagi: et navn med ild, slå wraith-en med det                                                                                                           | Spillet                                                 |
| 2   | Branns protokoll  | Ikoner, grupper, preview med sprite                                                                                                                         | `npm run quest` (leser skjema)                          |
| 3   | Laugets regler    | «Et navn bærer bare ett element» (`rule.custom()` som deler `magic.ts` med spillet) og «ingen to våpen med samme navn» (asynkron validering mot datasettet) | `npm run quest` (validerer testdokumenter mot skjemaet) |
| 4   | Smiens tegnebrett | Egen input (`components.input`)                                                                                                                             | `npm run quest`                                         |
| 5   | Prøvestua         | Egen visning i Studio som viser utregnet skade og element                                                                                                   | `npm run quest`                                         |
| 6   | Smi-knappen       | Egen dokumenthandling som setter `forgedAt`                                                                                                                 | Spillet (ser `forgedAt` i data)                         |

- `npm run quest` → `sanity exec scripts/quest.ts` ✅ (bygget 2026-10-23). Laster `sanity.config.ts` (også `.tsx`-skjema) og tester oppførsel:
  - Branns protokoll: `icon`, `preview.select` henter `sprite`, `prepare()` returnerer React-`media`.
  - Laugets lov: kjører spillerens egne `rule.custom()`-regler (felt- og dokumentnivå) mot testnavn med en ekte klient mot datasettet. Krever at «Flaming Frost Blade» og et eksisterende navn avvises som _feil_ (ikke advarsel), og at «Flaming Blade» og et unikt navn godtas. `validateDocument` ble droppet: den krever et helt workspace.
  - Spritevelgeren: `components.input` på `sprite`-feltet.
  - Prøvestua: kaller `defaultDocumentNode` med en opptakende Structure Builder og ser etter `S.view.component(...)`.
  - Testet mot riktig løsning og tre typiske feil (bare advarsel, for streng regel, mangler duplikatsjekk).
- `src/game/magic.ts` (gjenkjenning av elementer i navn) er laget allerede, fordi Laugets lov trenger den. Kamp og effekter for elementer gjenstår i fase 2.
- `src/components/SpriteImage.tsx`: ferdig komponent for å tegne en sprite i Studio, så questene bare er vanskelige på Sanity, ikke på spillets egen sprite-matematikk.
- Hver quest lenker til Learn-leksjonen den bygger på.
- Løsningsforslag i egen mappe eller gren, publiseres dagen etter.

## Fase 3b: Startversjon og løsninger ✅ (ferdig 2026-10-27)

**Gjort:** `main` har startversjonen, `solutions` har fem referanseløsninger tagget `solution/<quest-id>`, og `npm run verify-release` (med `--build`: ren `npm ci` og `next build`) går grønt på begge. Ingenting er pushet: det felles repoet er ikke bestemt ennå.

**Problemet:** vi utvikler spillet og spiller det i samme kopi. Løsningen på Branns protokoll ligger allerede i `item.tsx`, så en kollega som kloner nå, får questen gratis. Og når vi slipper kapittel 2, må spillerne kunne hente oppdateringer uten at det krasjer med sine egne løsninger.

### Prinsipp: spillerfiler og spillfiler

| Spillerfiler (spilleren endrer, vi rører dem ikke etter lansering) | Spillfiler (vi oppdaterer, spilleren lar dem være)     |
| ------------------------------------------------------------------ | ------------------------------------------------------ |
| `src/sanity/schemaTypes/**`                                        | `src/game/**`, `src/components/**`                     |
| `sanity.config.ts`                                                 | `src/app/**`, `scripts/**`                             |
| `src/sanity/studio/**` (nye komponenter spilleren lager)           | `src/sanity/lib/**` (hjelpere vi gir dem), `public/**` |

Nye kapitler legger til _nye_ filer og hjelpere, men endrer aldri spillerfiler. Da gir `git pull` ingen konflikter. Trenger et kapittel en endring i en spillerfil, blir det en del av questen («registrer typen din i `index.ts`»), ikke noe vi gjør for dem. Lista står også i README, så spillerne vet hva de kan endre.

### Grener og tagger

```
main ─────●──────────────●────────────●──>   startversjon: spillfiler + uløste spillerfiler med QUEST-kommentarer
           \               \              (kapittel 2 og 3 legges til når de slippes)
solutions   ●─●─●─●─●       ●─●─●─●──>      én commit per quest, tagget solution/<quest-id>
```

- **`main`** er det kollegaene kloner: spillfiler pluss spillerfiler i startform. Ingen løsninger.
- **`solutions`** følger `main` og har én commit per kode-quest, med taggen `solution/<quest-id>`. Spilleren kan se en løsning med `git show solution/the-guilds-law`, eller på GitHub.
- **Løsningene pushes ikke til det felles repoet før de slippes.** Grenen ligger lokalt (eller i et privat repo) til dagen etter at questen åpner, så pusher vi taggen. Det gir noe å diskutere i kanalen: «min løsning vs. fasiten».
- **Spillerne kloner eller forker** det felles repoet (ikke «Use this template»), slik at `git pull` henter nye kapitler.

### Fremgangsmåte nå

1. **Referanseløsninger for alle fem kode-questene**, skrevet ordentlig (ikke testvariantene fra checker-testingen): Branns protokoll (din løsning), Laugets lov (med `guild.ts`), Spritevelgeren (rutenett med `SpriteImage`), Prøvestua (visning med sprite, skade og element), Smi-knappen (`useDocumentOperation` → `patch` + `publish`).
2. **Startform for spillerfilene:** `item.tsx` uten ikon og uten `prepare`, med `QUEST: Brann's Ledger`-kommentar. `sanity.config.ts` som nå, med sine QUEST-kommentarer.
3. **Første commits på `main`:** spillmotoren og startversjonen. Så `solutions`-grenen med én commit og én tagg per quest.
4. **Automatisk kontroll** (`npm run verify-release`):
   - på `main`: `npm run quest` gir _ingen_ fullførte kode-quester, og hver melding sier hva som mangler;
   - på `solutions`: alle fullført;
   - typecheck, Sanity-skjemasjekk og build på begge.
     Kjøres før hver lansering, så en løsning aldri lekker inn i `main`.
5. **Dokumentasjon:** README skrives for spillere (kom i gang, hvordan quester virker, hvilke filer som er deres). Ny `docs/arrangor.md` for oss (slippe kapittel, slippe løsning, kjøre kontrollen).
6. **Du spiller videre fra en egen klone**, slik kollegaene gjør, ikke i utviklingsmappa. Sanity-prosjektet ditt kan gjenbrukes der: kopier `.env.local`.

### Ved hver lansering

1. Bygg kapitlet på `main` (nye spillfiler og hjelpere, quester i `chapters.ts`, sjekker i `scripts/quest.ts`).
2. Skriv løsningene på `solutions`, én commit og én tagg per quest.
3. `npm run verify-release`.
4. Push `main`. Kapitlet åpner på datoen (`NEXT_PUBLIC_CALENDAR_START`).
5. Dagen etter: push løsningstaggene for kapitlet.

### Spørsmål til deg

- [ ] Hvor skal det felles repoet ligge (GitHub-organisasjon på jobben, privat repo)?
- [ ] Når slippes løsninger: dagen etter at en quest åpner, eller samlet når kapitlet er over?
- [ ] Skal din løsning på Branns protokoll (ikonet og previewen) bli referanseløsningen?

## Fase 4: Deling, del 1

- «Del fremgang»-knapp: kopierer tekst i Wordle-stil (kapittel, quester, smienivå, antall runeord), uten løsninger.
- Eventuelt et pikselkort-bilde med ridderen og våpenet.

## Fase 5: Kapittel 2 – Jegeren

Bestiariet (`monster`-type + Structure Builder) · Byttet (referanser, `drops->`) · Orakelets gåter (GROQ) · Runene svikter (`element`-felt + input som foreslår element fra navnet med `magic.ts`) · Laugets nye lov (innholdsmigrering, for eksempel at `sprite` blir et objekt) · Runeskriveren (TypeGen).

Spillet trenger en dokumentert **kontrakt** for typene det leser (`monster`: name, kind, size, sprite, weakness, drops). HP regnes ut av spillet fra størrelse.

## Fase 6: Kapittel 3 – Byen våkner

Runene i ilden (Function setter `element` ut fra navnet ved publisering) · Byropet (Function → kanal) · Skalden (Agent Actions) · Prøv før du publiserer (Visual Editing / live) · Julaftenslippet (Content Releases) · Smiens regnskap (App SDK) · Del verktøyet (plugin).

## Fase 7: Felles lag

Hallen i Frostholm (leser alle registrerte prosjekter på serveren) og Frostkjempen (felles HP; serveren regner ut skaden selv fra smienivå og element).

## Byggerekkefølge for produktet

Dette er rekkefølgen på eksisterende tekniske arbeid før release, med avhengigheter. Oppgavene under fase 4–7 er eldre ideer og er ikke automatisk del av release-scope.

1. **Produktkontrakt:** lås læringsmål og lukeinnhold for begge løypene, poengregel, hint-/fasitflyt og databeslutning for deltakeroversikten. Utkast for uke 1 og åpne produktvalg står i [questplan.md](questplan.md), men må godkjennes før nye mekanikker bygges.
2. **Progresjonsfundament:** støtt valg av løype, ukentlig kapittelåpning, lineær lukeprogresjon, statusene låst/aktiv/fullført og gjenopptakelse etter reload. Neste luke krever fullføring. Poeng må knyttes til reell fullføring og kan ikke være nødvendig for å låse opp innhold.
3. **Teknisk løype uke 1:** custom input er en kjerneoppgave. Kodevinduet sjekker valgene; deltakeren prøver deretter den innebygde komponenten i Studio.
4. **Ikke-teknisk løype uke 1:** bygg oppgaver rundt innhold og grunnleggende Sanity-bruk, uten å kreve kode. Gjenbruk ukas historie og spillverden, men ikke samme ferdighetskrav.
5. **Felles deltakeroversikt:** bygg først etter at offentliggjorte felt, samtykke, avmelding/skjuling og eier av deltakerlista er bestemt. Kun nødvendige publiserte data; ingen token i klienten og ingen sist-sett-posisjon i første release.
6. **Uke 2–3 og finale:** utvid begge løypene. Felleskapitler og karakterer kan gjenbrukes, men oppgaver og belønninger må utformes og testes for hver målgruppe. Finalen må virke uten deltakeroversikt.
7. **Releasekontroll:** tester for framgang, poeng, fullføringskrav, reload og løypeavhengighet; ferskkloneprøve for begge målgruppene; lint, typecheck, Sanity-validering, build og nettleserprøve. Oppdater README, gjennomspillingsguide og arrangørguide først når de samsvarer med det som faktisk er implementert.

**Scope-varsel:** To fullverdige løyper dobler ikke nødvendigvis spillmekanikken, men gir reelt mer oppgave- og testarbeid. Dersom tidsplanen blir for stram, kutt bonusoppgaver, spøkelser og sanntid først; ikke slipp en løype som bare er en utestet idé.

**Sjekkflyt (2026-11-12):** Kodevinduet sjekker automatisk ved åpning og etter
en kort skrivepause; utkast lagres i nettleseren, ikke i repo-filer.
Ikon/preview, validation og custom input bruker denne flyten. Etter bestått
aktiverer Studio vår versjon av custom input; deltakerens kodeutkast blir ikke
skrevet til prosjektet. Document view løses fortsatt i repoet og sjekkes med
`npm run quest`. Automatisk sjekk ved fillagring av repooppgaver er fortsatt
planlagt.

### Neste utviklingssteg: progresjonsgrunnlag (2026-11-10)

**Mål:** Oppgaver kan legges til eller tas bort uten at motoren antar et fast
antall. Teknisk og ikke-teknisk løype får egne rekker, med eventuell felles
oppstart. Neste kjerneoppgave krever fortsatt fullføring av den forrige.

Bygg og kontroller én liten leveranse om gangen:

| Leveranse                      | Arbeid                                                                                                                                                                  | Ferdig når                                                                                                                                                    |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A. Løypebevisst datagrunnlag   | Agent for modell/motor: løypetype, filtrering av oppgaver og totalsum ut fra valgt løype. Eksisterende kodeoppgaver tilhører teknisk løype; oppstarten kan være felles. | Ulike oppgaveantall virker uten kopiert motorlogikk. Ukentlig åpning og frivillig bonus beholdes. Ingen ikke-tekniske oppgaver eller poengverdier diktes opp. |
| B. Regresjonstester            | Agent for tester: automatiserte tester av motor og lagring med små, syntetiske oppgavesett.                                                                             | Tester dekker ulike løypelengder, sekvenskrav, bonus, datoåpning, endret oppgavesett og gammel lagret framgang. Kan kjøres med én npm-kommando.               |
| C. Koble på eksisterende spill | Hovedagent: bruk samme filtrerte oppgavesett for brett, smienivå og utviklerhopp; bevar gamle fullføringer.                                                             | Teknisk løype virker som før. Ingen teller eller utviklerhandling bruker en annen løype enn brettet. Typecheck og build passerer.                             |
| D. Synlig løypevalg            | Egen senere UI-leveranse etter at ikke-teknisk uke 1 er godkjent og spillbar. Lagre valget per Sanity-prosjekt.                                                         | Ny deltaker kan velge en faktisk spillbar løype og fortsette etter reload. Policy for løypebytte er avklart.                                                  |
| E. Uke 1 ende-til-ende         | Implementer og test godkjent innhold i begge løyper, deretter poengfordeling.                                                                                           | Begge målgrupper har en sammenhengende vei og testet tidsbruk; poeng belønner ikke bare løypa med flest luker.                                                |

**Arbeidsdeling nå:** Modellagenten eier bare quest-typer, motor, lagring og
merking av eksisterende oppgaver. Testagenten eier testfiler og testkommando.
Hovedagenten eier hook-integrasjon, dokumentasjon og samlet kontroll. Agentene
skal lese eksisterende lokale endringer og bevare dem; ingen commit eller push.

**Avgrensning:** Start med A–C. Ikke vis et valg som sender deltakeren til en
tom løype. Løypevalg-UI, løypebytte, nye oppgaver, nye poengregler og
deltakeroversikt inngår ikke i denne første leveransen.

**Testkrav:** Bestått sjekk uten at luka er gitt, skal ikke gi fullføring.
Bonus skal ikke sperre neste kjerneoppgave. Fullføringer lagres med stabile
oppgave-ID-er, ikke plassnummer: fjernede oppgaver teller ikke, og nye oppgaver
er ikke automatisk bestått. Endring av allerede publiserte forutsetninger må
vurderes før innhold endres mens folk spiller.

#### Status etter kontroll 2026-11-10

- [x] **A:** `QuestTrack`, lagret løype per prosjekt og filtrering med
      `chaptersForTrack`. Gamle lagringer blir teknisk løype; tidligere fullføringer
      beholdes og gamle hopp-over-markeringer gir ikke adgang til neste luke.
- [x] **B:** `npm test` kjører 24 tester for motor, lagring og hook-integrasjon.
      Testene dekker blant annet ulike oppgaveantall, bonus, datoåpning, stabile
      ID-er og at gjentatte effekter ikke gir dobbel fullføring eller belønning.
- [x] **C:** Brett, smienivå, nivåvarsler og utviklerhopp følger samme løype.
      Utviklerhopp ignorerer ukjente oppgaver og oppgaver i den andre løypa, og
      bevarer lagrede fakta utenfor valgt oppgavesett.

**Verifisert:** TypeScript, målrettet ESLint for quest-filer og hook,
`npm run build` og `git diff --check` passerer. Produksjonsbygget er også
prøvd i Chromium: oppstart og bevegelse, fullføring via React-effekten,
låst etterfølger selv om sjekken består, gammel lagring, løypeavhengige
tellere og reload. `?dev=quests` viser ikke utviklerpanelet i produksjon.

**Begrensning:** Nettleserprøven brukte simulerte API-svar og lagrede
testfakta, ikke innhold skrevet i et ekte Sanity-prosjekt. Kalenderdato var
ikke konfigurert i nettleserbygget; datoåpning ble testet i motor-testene.
Dette godkjenner progresjonsgrunnlaget, ikke hele uke 1 eller release.

**Videre uke-1-arbeid:** Det konkrete utkastet med tekst, Studio-avslutning,
hint og sjekkvilkår står i [uke1-luker.md](uke1-luker.md) (2026-11-11).
Egenbekreftelse for ikon/preview og validation er godkjent som første
leveranse under. Referansesjekker for publiserte endringer og de øvrige
oppgavene avklares per leveranse. Oppgaveagentene kan få én godkjent luke hver
med tekst, sjekk og tester som ansvar. Avklar løypebytte før D bygges; løypevalg
skal først vises når begge oppgavesettene er spillbare. Poengfordeling og
full gjennomspilling mot ekte Sanity-prosjekter hører til E.

### Utviklingsstart og utsatte verktøy (2026-11-11)

**Implementert første leveranse:** Ikon/preview og validation krever bestått kodetest
og egenbekreftelsen «Jeg har prøvd dette i Studio» før neste luke åpnes.
Bekreftelsen lagres per prosjekt. Samme handling finnes i kodevinduet,
kalenderen og samtalen med Brann; Studio-åpning lukker oppgaveoverlegget, men
fullfører ikke luka. Låste, ikke-beståtte og allerede bekreftede luker kan ikke
bekreftes på nytt. Gamle fullføringer beholdes uten oppdiktede bekreftelser.
Poeng, bonusstatus og andre innholdssjekker er ikke endret.

**Arbeidsdeling:** To små Haiku-agenter fikk adskilt ansvar for progresjon og
regresjonstester. Hovedagenten integrerte UI; en tredje Haiku-agent gjorde
uavhengig kontroll. Ingen subagenter har fått eierskap til samme fil.

**Kontroll:** 47 automatiske tester, TypeScript, målrettet lint og
produksjonsbygg passerer. Chromium-prøven dekker deaktivert bekreftelse før
kodebestått, låst neste luke, tastaturbekreftelse, reload og gammel lagring.
Kalenderen er sett ved 1280×720, 1440×900, 1920×1080 og 390×844; en horisontal
mobilklipping ble rettet. Prøven bruker simulerte API-svar, forhåndslagrede
kodefakta og en erstattet Studio-side. Ekte Studio-innskriving/publisering og
testing med en ny deltaker gjenstår; dette er ikke releasegodkjenning.

Deretter ferdigstilles kalenderoppgavene trinnvis på dagens kart. Åpne valg
avklares ved behov: løypebytte før løypevelger, poeng før poengfordeling og
personvern før deltakeroversikt. Uke 2–3 trenger fortsatt valgt pensum; planen
er ikke en påstand om at hele releaseinnholdet er ferdig bestemt.

**Frivillig kampdel, senere:** Ønsket retning er fiender som slår tilbake,
spillerhelse og opptjente oppskrifter/materialer som brukes til utstyr i
Studio. Start eventuelt med én sammenhengende spillrunde før flere fiender
og rustning. Sanity beskriver utstyret, spillet bestemmer stats og kontrollerer
opptjente ressurser. Dette er ikke et nytt krav for kalenderprogresjon;
detaljer og balanse avklares før bygging.

**Verdenseditor, til slutt:** Lag først oppgavene med enkle plasseringer.
Editoren og endelig utforming av verdenen kan komme etterpå; ikke bygg
editor nå. Bevar stabile oppgave-ID-er og koblingen fra luke til sted.
Koordinater hører til kartdata, ikke sjekkene. Grafikk, kollisjon og
interaksjon må kunne flyttes samlet når editoren bygges. Den skal bruke samme
kartdata som spillet, ikke introdusere en konkurrerende kopi av verdenen.

### Rettelser etter gjennomspilling (2026-11-11)

**Gjort:**

- Ikonvalg er del av samme luke som preview, ikke en ny oppgave. Valgt
  dokumenttypeikon vises separat fra våpenbildene, med et galleri over ikonene
  kodevinduet støtter. Ikon, sprite-felt, spritevisning og navn sjekkes hver for
  seg; riktig sprite får godkjent selv om navnet mangler.
- Feil fra `prepare()` vises rett under editoren. Mobilvisningen har én
  rullbar kolonne, slik at previewen ikke dekker feilmeldingen. `SpriteImage`
  har tydeligere forklaring og større eksempler; «bare lese»-merket er fjernet.
- Videre eksperimentering i egen editor ligger i en lukket, tydelig valgfri
  seksjon. Det er ikke et nytt fullføringskrav.
- Studio-bekreftelse gir en synlig, animert «Gratulerer!»-markering over
  kodevinduet, uten å åpne kalenderen. Redusert bevegelse respekteres.
- Brann viser færre og mer relevante knapper. Luke 3 forklarer behovet for
  validering gjennom en feilbestilling fra huset vest for brønnen; ingen ny
  spillmekanikk er innført. Enter aktiverer fokusert knapp fremfor å overstyre
  den med et sideskift.
- Ved oppslagstavla åpner E kodevinduet direkte, uten omveien om kalenderen
  og uten å skrive en E inn i koden.

**Kontroll:** 59 automatiske tester, TypeScript, målrettet lint og
produksjonsbygg passerer. `GameClient` har fortsatt to eksisterende
`react-hooks/set-state-in-effect`-funn; sammenligning med `HEAD` bekrefter
ingen nye lintfunn i denne fila. Chrome-prøven dekker separat delresultat, ikon og
galleri, referansen, `prepare()`-feil, valgfri fortsettelse, gratulasjon og
redusert bevegelse. Feilen er synlig og ikke overlappet ved 1280×720,
1440×900, 1920×1080 og 390×844. Direkte åpning ved oppslagstavla og Branns
historie/knapper i luke 2–3 er også prøvd. Utvalgte skjermbilder er visuelt
kontrollert. API-svar og fremgang var testdata; ekte Studio-arbeid og en ny
deltakers gjennomspilling gjenstår.

**Senere, ikke prioritert nå:**

- Klassisk spillguide med bilder av kontroller, figurer og handlinger.
- Visuelle måleksempler i Branns samtaler og eventuelle samtaleportretter.
- Samlet skjermbildeoversikt til designgjennomgang og pitch: intro,
  samtalesider, låst/aktiv/fullført luke, kodevindu med start/delresultat/feil,
  Studio-prøve og fullføringsmarkering. Denne leveransen har bare midlertidige
  kontrollbilder, ikke en ferdig katalog over alle scenarioene.

### Navnevalidering etter gjennomspilling (2026-11-11)

**Problem:** Sprite-delen opplevdes morsom, mens navnedelen krevde et brått
sprang til klient, asynkron kode og duplikatsøk. En sprite-krasj ble dessuten
gjentatt under navnesjekkene, så deltakeren ikke kunne se hvilken del som feilet.

**Justert:** Samme luke, men tydelig rekkefølge: regel på `sprite` først,
deretter egen regel på `name`. Tre hint forklarer returverdier, dokumentets
`context` og navnesøkets `async`/`await`. Hjelpefanen forklarer argumentene til
`sameNameParams` og at søket gir et antall, med eksempler på opptatt navn,
ledig navn og lagring av eget dokument. Ingen full løsning er lagt i starteren.

Sprite og navn får uavhengige delresultater. Nytt navn og lagring av eget
dokument har hver sin sjekk. En krasj vises under editoren og bare ved de
relevante delkravene; `valueOfField`-feilen peker mot `context.document`.
Våpen med sprite må også godtas, og dokumentnivå-validering støttes fortsatt.
Ingen krasj eller andre blokkerende feil kan gi fullføring. Kodebestått
krever fortsatt egenbekreftelsen fra Studio før neste luke åpnes.

| Spørsmål   | Vurdering                                                                                     |
| ---------- | --------------------------------------------------------------------------------------------- |
| Tydelig    | Bedre adskilte trinn og konkrete hjelpeeksempler; må prøves av deltakeren igjen.              |
| Verdt det  | Reglene hindrer Branns feilbestilling og prøves i Studio.                                     |
| Svarer     | Hver del får egen status etter skrivepausen, også når den andre krasjer.                      |
| Belønnende | Sprite-resultatet beholdes mens navnedelen løses; eksisterende fullføringsmarkering beholdes. |
| Passer     | Ingen ny luke eller mekanikk; navnedelens faktiske vanskelighetsgrad må fortsatt vurderes.    |

**Kontroll:** 14 nye regresjonstester, 73 totalt, samt TypeScript, målrettet
lint og produksjonsbygg passerer. Chrome-prøve med testdata dekker halvferdig
kode, nye hint, hjelpefanen ved fire skjermstørrelser, isolerte feil og at
Studio-steget fortsatt kreves. Ingen ekte Studio-publisering er utført.
Neste vurdering er om en ny gjennomspilling faktisk gir mindre behov for
ekstern hjelp; navnedelen er ikke erklært enkel bare fordi testene passerer.

**Lesbarhet etter ny tilbakemelding:** Hintene hadde blitt for tette.
Kodevinduet og kalenderen bruker nå samme hintvisning: egen overskrift,
korte avsnitt, dokumentasjonslenke på egen linje og mer luft. Navnehintet har
tre nummererte steg fremfor ett langt avsnitt. De detaljerte hjelpeeksemplene
ligger fortsatt i hjelpefanen; ingen fasit er lagt i starteren. 75 tester,
TypeScript, målrettet lint og bygg passerer. Hintene er prøvd ved fire
skjermstørrelser og kontrollert visuelt på desktop og mobil.

**Mindre detaljarbeid, etter gjennomspilling:** Kalenderoppgaver skal være
små og morsomme også uten AI eller kodefullføring. Klient og API-versjon er
ikke ferdigfylt. GROQ, søkeparametre og draft-/release-håndtering ligger bak
den ferdige `isNameTaken(...)`-hjelperen. Selve validation-reglene på navn og
sprite er igjen åpne oppgaver. En generell lenke til Validation-dokumentasjonen er synlig
fra starten; tre strukturerte hint fører videre fra dokumentasjonens
`Enforce a unique field value`-mønster, via hjelpefanen, til sjekken mot
`context.document`. `rule.unique()` gjelder array-verdier, ikke andre documents.
Startkoden kjører, men består ikke sjekken før begge reglene er fullført.
Eksisterende lagrede utkast erstattes ikke automatisk.

**Kontroll av startkoden:** 80 tester, TypeScript, målrettet lint og bygg
passerer. Nye tester kjører den faktiske malen gjennom kodevinduets
kodekjører: tom start, navnevalidering alene, sprite-validering alene og begge
reglene sammen. Den tidligere Chrome-prøven av kodevindu og Studio-bekreftelse
er ikke gjentatt etter denne startkodeendringen. Testdata er simulert, ikke
ekte Studio-publisering.
