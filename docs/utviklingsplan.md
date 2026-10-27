# Utviklingsplan: Sanity Winter Quest

Levende dokument. Oppdateres når faser blir ferdige eller beslutninger endres.

## Prinsipper (gjelder alle faser)

1. **Sanity beskriver, spillet avgjør.** Innhold sier *hva* noe er (navn, type, sprite). Det finnes **ingen tall å fylle inn** i Studio: skade, HP, elementbonus og hvilke sprites som finnes, ligger i spillkoden. Monstre får for eksempel type og størrelse, ikke HP.
2. **Ett Sanity-prosjekt per spiller.** Spillet leser bare publisert innhold. Deling skjer ved at noe leser fra alles prosjekter, aldri ved felles redigering.
3. **Bevisste feil, ingen tilfeldige.** Startmodellen er ryddig, bortsett fra det en quest skal lære spilleren å fikse.
4. **Quester sier *hva*, ikke *hvordan*.** Tips kommer lagvis: questtekst → Branns bok (Learn-lenke) → `npm run quest` → løsningsforslag dagen etter.
5. **Ingen mekanikk før spilleren har møtt den.** En quest kan bare bygge på noe spilleren har sett i spillet (Laugets lov kom før navnemagi var introdusert, og ble flyttet). Hver quest har en «Where to work»-linje (fil eller sted, ikke svaret), og kode-quester sier hvordan de sjekkes.
6. **Hver fase kan sendes for seg.** Etter hver fase: `tsc`, lint, build og en sjekk i nettleseren på 1280×720, 1440×900, 1920×1080 og mobilbredde.
7. **Ingen dominerte valg.** Et felt i Studio skal bare finnes hvis valget betyr noe. Finnes det ett svar som alltid er best, er det ikke et valg.

## Beslutninger så langt

- Navnemagi: **delvis skjulte ordlister**. Brann tipser om ild i starten, resten utforskes.
- Elementbonus er **liten** (×1,5 mot svakhet, ×0 mot immunitet). Mest for moro.
- **Ingen materialer og ingen skadetall** (besluttet 2026-10-23). Alle smidde våpen slår like hardt; styrken følger **smiens nivå** (4/6/8/10), som stiger når man fullfører quester. Det som skiller våpen, er **navnet og elementet**, og det betyr noe fordi fiender har ulike svakheter.
- Effekter bruker Kenney Tiny Dungeon: **62** hogg-streker (angrep), **60** sikte-hjørner (mål i rekkevidde), **61** treff-glimt. Alle hvite, fargelegges per element. Elementpartikler lages som 1-px partikler i elementfarge.
- Deling: «Wordle-deling» først, Byropet (Function → kanal) i kapittel 3, Frostkjempen som finale.

## Åpne spørsmål

- [ ] Språk i spillet: norsk eller engelsk dialog og Studio-titler? (Kode og skjemanavn er engelsk uansett.)
- [ ] Kalender: startdato, og om quester åpnes på dato, i rekkefølge, eller begge deler.
- [ ] Krever Content Releases og Agent Actions en bestemt Sanity-plan eller har de kvoter? Avgjør om de er obligatoriske eller valgfrie.
- [ ] Får vi lov til å bruke en innkommende webhook i jobbkanalen (Byropet)?

---

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
- Kapittel 1: Den knuste smia → Prøv bladet (beseir wraith-en, **+1 smienivå**) → Branns protokoll → Laugets lov → Tegnebrettet → Prøvestua → Smi-knappen (**+1 smienivå**). Quest 3–6 sjekkes fra koden; Smi-knappen sjekkes i data (`forgedAt`).
- Kodesjekker leses fra `.quest/results.json` via `/api/quest-checks` (gitignored). `npm run quest` som skriver fila, kommer i fase 3.
- HUD: tracker med aktiv quest og fremgang, questlogg (J) med lagvise hint og Learn-lenker, toasts for fullført quest og hetere smie, Brann deler ut quester med egen replikk, «!» over Brann når han har en ny oppgave.
- `NEXT_PUBLIC_CALENDAR_START=YYYY-MM-DD` slår på datoåpning (kapittel N åpner N−1 uker etter). Uten den er alt åpent. `?dev=quests` åpner alt for testing.

## Fase 2: Navnemagi (delvis gjort 2026-10-23)

**Allerede på plass:** `magic.ts` (gjenkjenning), elementet vises i verktøytips og i Branns vurdering, wraith-en er svak mot ild (×1,5) og immun mot frost (×0), og questen «Power in a Name» introduserer navnemagi med Branns ild-tips. **Gjenstår:** visuelle effekter (aura, Kenney 60/61/62), brannskade over tid, runeboka, hemmelige ord med egne sitater.


- `src/game/magic.ts`, uten avhengigheter, slik at Studio kan importere den senere:
  - Elementer: 🔥 ild, ❄ frost, ⚡ lyn, ☠ gift, ✨ lys.
  - Ordstammer på engelsk og norsk, normalisering (små bokstaver, æøå beholdes), match på starten av hvert ord.
  - Hemmelige ord (Surt, Muspel, Brann, Nifl, Ymir, Mjølner, Thor, Jormund, Balder) gir et eget sitat eller en ekstra effekt.
  - Maks ett element. Ild + frost = damp (fuser ut, +0). Negasjoner («Unburnt») tolkes bevisst *feil*, siden det er poenget i «Runene svikter» i kapittel 2.
- Kamp: ×1,5 mot svakhet, ×0 mot immunitet, og en liten brannskade over tid for ild. Frost Wraith: svak mot ild, immun mot frost.
- Visuelt i verden:
  - Partikkelaura i elementfarge rundt våpenet i ridderens hånd.
  - Kenney 62 (hogg) i elementfarge ved angrep.
  - Kenney 60 (sikte) rundt wraith-en når den er innen rekkevidde.
  - Kenney 61 som treff-glimt.
  - Skadetall i elementfarge, og «Svak!» / «Immun» over fienden.
- HUD: elementmerke i verktøytips og kampstripe.
- **Runeboka** i questloggen samler ord man har oppdaget. Uoppdagede vises som «???» med antall per element.
- Brann tipser om ild første gang: *«De gamle smedene sa at navn som taler om flamme, biter dypere.»*

**Ferdig når:** «Flaming Sword» gir ild-effekt og bonus mot wraith-en, frost gir «Immun», og runeboka fylles.

## Fase 3: Kapittel 1 – Smia

| # | Quest | Konsept | Sjekkes av |
| --- | --- | --- | --- |
| 1 | Den knuste smia | Publisering | Spillet (GROQ) |
| 1b | Prøv bladet | Kamp (ingen Sanity) | Spillet |
| 1c | Power in a Name | Navnemagi: et navn med ild, slå wraith-en med det | Spillet |
| 2 | Branns protokoll | Ikoner, grupper, preview med sprite | `npm run quest` (leser skjema) |
| 3 | Laugets regler | «Et navn bærer bare ett element» (`rule.custom()` som deler `magic.ts` med spillet) og «ingen to våpen med samme navn» (asynkron validering mot datasettet) | `npm run quest` (validerer testdokumenter mot skjemaet) |
| 4 | Smiens tegnebrett | Egen input (`components.input`) | `npm run quest` |
| 5 | Prøvestua | Egen visning i Studio som viser utregnet skade og element | `npm run quest` |
| 6 | Smi-knappen | Egen dokumenthandling som setter `forgedAt` | Spillet (ser `forgedAt` i data) |

- `npm run quest` → `sanity exec scripts/quest.ts` ✅ (bygget 2026-10-23). Laster `sanity.config.ts` (også `.tsx`-skjema) og tester oppførsel:
  - Branns protokoll: `icon`, `preview.select` henter `sprite`, `prepare()` returnerer React-`media`.
  - Laugets lov: kjører spillerens egne `rule.custom()`-regler (felt- og dokumentnivå) mot testnavn med en ekte klient mot datasettet. Krever at «Flaming Frost Blade» og et eksisterende navn avvises som *feil* (ikke advarsel), og at «Flaming Blade» og et unikt navn godtas. `validateDocument` ble droppet: den krever et helt workspace.
  - Tegnebrettet: `components.input` på `sprite`-feltet.
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

| Spillerfiler (spilleren endrer, vi rører dem ikke etter lansering) | Spillfiler (vi oppdaterer, spilleren lar dem være) |
| --- | --- |
| `src/sanity/schemaTypes/**` | `src/game/**`, `src/components/**` |
| `sanity.config.ts` | `src/app/**`, `scripts/**` |
| `src/sanity/studio/**` (nye komponenter spilleren lager) | `src/sanity/lib/**` (hjelpere vi gir dem), `public/**` |

Nye kapitler legger til *nye* filer og hjelpere, men endrer aldri spillerfiler. Da gir `git pull` ingen konflikter. Trenger et kapittel en endring i en spillerfil, blir det en del av questen («registrer typen din i `index.ts`»), ikke noe vi gjør for dem. Lista står også i README, så spillerne vet hva de kan endre.

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

1. **Referanseløsninger for alle fem kode-questene**, skrevet ordentlig (ikke testvariantene fra checker-testingen): Branns protokoll (din løsning), Laugets lov (med `guild.ts`), Tegnebrettet (rutenett med `SpriteImage`), Prøvestua (visning med sprite, skade og element), Smi-knappen (`useDocumentOperation` → `patch` + `publish`).
2. **Startform for spillerfilene:** `item.tsx` uten ikon og uten `prepare`, med `QUEST: Brann's Ledger`-kommentar. `sanity.config.ts` som nå, med sine QUEST-kommentarer.
3. **Første commits på `main`:** spillmotoren og startversjonen. Så `solutions`-grenen med én commit og én tagg per quest.
4. **Automatisk kontroll** (`npm run verify-release`):
   - på `main`: `npm run quest` gir *ingen* fullførte kode-quester, og hver melding sier hva som mangler;
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
