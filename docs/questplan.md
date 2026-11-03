# Plan for Sanity-julekalenderen

Hvordan desember kan se ut, hvilke oppgaver som bør med, og hvordan vi får det
gjennomført med ansatte som har lyst. Tekniske beslutninger står i
[utviklingsplan.md](utviklingsplan.md). Plottet og Branns replikker står i
[historie.md](historie.md). Skissene ligger i Claude Design
(«Sanity-julekalenderen: konseptskisser»).

Oppdatert 2026-11-02: tre uker med oppgaver i stedet for 24 luker, en liste
per uke, bygda er pyntet fra start, og deltakerne ser hverandre gjennom
Sanity i stedet for en egen server.

---

## Kort fortalt

En julekalender med tre uker. Hver mandag åpner fire oppgaver og én bonus.
Oppgavene løses i deltakerens egen Sanity Studio, i den rekkefølgen man vil,
i løpet av arbeidsuka. Et lite pikselspill viser resultatet: det du publiserer,
dukker opp med en gang, og kodeoppgaver sjekkes automatisk når filen lagres.

- **Mandag:** ukas oppgaver åpner. Et kort i spillet viser dem.
- **I løpet av uka:** fire oppgaver på 15–25 minutter, og én frivillig bonus.
- **Fredag:** løsningene kommer, og en kort felles gjennomgang (15 min,
  frivillig). Oppgavene står åpne ut desember.
- **Ingen poeng og ingen toppliste.** Fremgang vises i det du lager, på
  figuren din og på et felles juletre.
- **Du ser de andre:** deres julekuler, det de har laget, og figurene deres
  der de var sist.
- **Oppsettøkt** fredag 27. november, så ingen stopper på installasjonen.

Fire oppgaver og én bonus per uke er en startverdi. Vi justerer når testerne
har tatt tiden på uke 1.

## Hva en god oppgave er

1. **Ett nytt Sanity-tema.** Ikke to.
2. **Synlig resultat** i spillet eller i Studio.
3. **Automatisk sjekk.** Helst ved at spillet leser innholdet, ellers når
   filen lagres eller gjennom `npm run quest`.
4. **Høyst 25 minutter** for en som ikke har sett den. Over 35 blir den bonus.
5. **Virker på gratisplanen** i Sanity.
6. **Bygger bare på det deltakeren har sett før** i tidligere uker. Innenfor
   en uke kan oppgavene tas i hvilken som helst rekkefølge.
7. **Gjenbruker det spillet allerede har.** Hver uke får én ny ting i spillet
   (for eksempel monstre), og flere oppgaver bygger på den.

For å vurdere en oppgave før den bygges: skillen `luke-design`
(`.claude/skills/luke-design`) og [spillvurdering.md](spillvurdering.md).

## Oppgavene

★ oppgave, ☆ bonus. Datoene gjelder 2026.

### Uke 1: Studio (åpner mandag 30. november)

| | Sanity-tema | Hva deltakeren gjør | Sjekk |
|---|---|---|---|
| ★ | Documents og Publish | Lager og publiserer et våpen, ser det i spillet | Spillet |
| ★ | `icon` og `preview` | Viser ikon og sprite i dokumentlista | Når filen lagres |
| ★ | Validation | Påkrevd sprite for våpen, unike navn | Når filen lagres |
| ★ | Custom input | Velger som viser pikselkunsten | Når filen lagres |
| ☆ | Document view | Egen fane som viser våpenet slik spillet gjør | Når filen lagres |

Disse finnes allerede i spillet. Document action («Smi»-knappen) flyttes til
uke 3.

### Uke 2: Innholdsmodellering (åpner mandag 7. desember)

Ny ting i spillet: monstre fra innhold, med kamp og bytte (ca. 2,5 dagsverk).

| | Sanity-tema | Hva deltakeren gjør | Sjekk |
|---|---|---|---|
| ★ | Ny document type | Lager en `monster`-type. Monstrene dukker opp i spillet | Spillet |
| ★ | `reference` og `->` | Kobler et monster til gjenstandene det slipper | Spillet |
| ★ | GROQ i Vision | Den ene obligatoriske GROQ-oppgaven | Resultatet sammenlignes |
| ★ | `image` og assets | Tegner sin første julekule og laster den opp | Spillet |
| ☆ | GROQ | Frivillige GROQ-oppgaver | Resultatet sammenlignes |

Monstrene følger en fast kontrakt, og spillet avgjør HP og skade: `name`,
`kind`, `size`, `sprite`, `weakness`, `drops`.

### Uke 3: Utover skjemaet (åpner mandag 14. desember)

| | Sanity-tema | Hva deltakeren gjør | Sjekk |
|---|---|---|---|
| ★ | Document action | Egen «Smi»-knapp som setter et tidspunkt og publiserer | Spillet |
| ★ | Portable Text | Tekst med egne marks som vises i spillet | Når filen lagres og innhold |
| ★ | Functions | Fyller et felt automatisk ved publisering (30–45 min) | Spillet |
| ★ | Offentlig dataset og GROQ | Henter en kollegas julekuler fra deres prosjekt | Spillet |
| ☆ | Custom input | Lager tegnebrettet for julekuler selv | Når filen lagres |

Functions krever claimet prosjekt og `npx sanity login`. Den siste
★-oppgaven bruker det samme som gjør at deltakerne ser hverandre (se under).

### Uka før jul

Ingen nye oppgaver. Juletreet på torget er fullt av kuler, og vi har en
frivillig felles fremvisning av det folk har laget. Alle oppgavene står åpne
ut desember.

### I reserve

Kan bytte inn en oppgave som ikke fungerer, eller bli ekstra bonus.

| Idé | Merknad |
|---|---|
| Content migration | Endre formen på et felt og migrere innholdet |
| TypeGen | Generere typer og bruke `defineQuery` |
| Singleton | Ett innstillingsdokument som styrer noe i spillet live |
| Agent Actions | Bruker AI-kreditter; sjekk hvor mange gratisplanen har |
| `definePlugin` | Pakke en custom input som plugin |
| App SDK | Egen app med oversikt over innholdet |
| GROQ-powered webhook | Krever en felles tjeneste og lov til å poste i Slack |

### Kuttet

| Idé | Grunn |
|---|---|
| Content Releases | Enterprise-tillegg, ikke på gratisplanen |
| Scheduled drafts, Comments, Tasks | Ikke på gratisplanen |
| Presentation / Visual Editing | For mye arbeid å få klikkbare overlays i et canvas-spill |
| 24 luker, én per dag | Oppgavene er ikke knyttet til en dag; en liste per uke passer bedre |
| Poeng og butikk | Gir rangering og mer å bygge. Erstattet av fremgangen under |

---

## Grensesnittet

- **Hjørnekortet** øverst til venstre: «Uke 2», én prikk per oppgave,
  «frist fredag» og oppgaven du holder på med.
- **Lista** (tast J): én fane per uke, oppgavene til venstre og detaljene til
  høyre. Med Studio åpent blir det én kolonne.
- **Mandag:** et kort med ukas oppgaver, én gang.
- **Oppgave ferdig:** kort med det du fikk og det du lærte, og knappen
  «Velg neste oppgave».
- **Fredag:** «Se løsning» på hver oppgave. Løsningen kan vises i spillet.

## Fremgang

Bygda er pyntet fra start. Fremgangen vises på tre måter, som alle fungerer
når flere spiller:

1. **Det du lager, finnes i spillet.** Våpen, monstre og bilder fra Studio.
   Dette er kjernen og finnes allerede.
2. **Julekuler du tegner selv.** Hver oppgave gir en kule du tegner på 8 × 8
   ruter (startverdi). Kula lagres som et dokument i ditt eget prosjekt og
   henger på juletreet på torget, sammen med alle de andres.
3. **Din egen figur.** Lages før uke 1 i en ferdig figurskaper i Studio (se
   under). Andre ser den når de ser figuren din.

### Egen figur

Figurskaperen er ingen oppgave. Den er ferdig laget av oss, og skal vise hvor
bra en *custom input* i Studio kan bli. Senere lager deltakeren enklere
varianter selv (sprite-velgeren i uke 1, tegnebrettet i uke 3). Krav og
replikker står i [historie.md](historie.md).

Den trenger en spritepakke med figurer i lag (kropp, hår, klær, lue):

| Pakke | Lisens | Merknad |
|---|---|---|
| Kenney «Roguelike Characters» | CC0 | Gratis og samme kilde som resten. Sjekk at den har lag, og at stilen passer Tiny Dungeon |
| LPC (Liberated Pixel Cup) | CC-BY-SA / GPL | Svært mange lag, men større figurer og annen stil. Krever kreditering |
| Betalte pakker (itch.io) | Varierer | Ofte finest, og ofte med vinterklær. Les lisensen |

**Testet 2026-11-02: Kenney «Roguelike Characters».** Lagene finnes og
passer sammen: 4 hudfarger (pluss grønn), bukser, ca. 70 overdeler og
rustninger, hår og skjegg i flere farger, og hjelmer og hatter. Men:

- Bare forfra og ett bilde per figur. Ingen gange og ingen retninger, så
  figuren må «hoppe» for å se levende ut.
- Annen stil enn Tiny Dungeon: brede kropper, små hoder og ingen øyne.
  Med en mørk kant rundt blir det nærmere, men fortsatt tydelig ulikt.

Den holder for en enkel figurvelger, men ikke for en figurskaper som skal
være det fineste i Studio. Neste steg, i rekkefølge:

1. Se på betalte pakker med lag, gange i fire retninger og vinterklær, og
   les lisensen. (itch.io og kenney.nl er sperret på kontornettet; bruk et
   annet nett.)
2. Hvis ingen passer: bytte all grafikk til samme familie som
   Roguelike Characters, eller tegne lue, skjerf og farger selv oppå Tiny
   Dungeon-figurene.

**Søk etter andre pakker (2026-11-02).** Ikke åpnet eller testet ennå,
bare lest om:

| Pakke | Lag | Gange | Lisens | Merknad |
|---|---|---|---|---|
| Mana Seed Character Base (Seliel the Shaper) | Ja, mange | Ja, mange animasjoner | Egen lisens, betal hva du vil | Mange tilleggsklær. Lisensen forbyr å gi grafikken videre |
| LPC Character Generator | Ja, svært mange | 4 retninger | CC-BY-SA / GPL / OGA-BY per lag | Generatoren lager kredittliste. Større figurer og annen stil. Ligger på GitHub, så kan testes nå |
| nonemo «Character Creation Asset Pack» | 45 hår, 28 antrekk | Ukjent | CC0 | Gratis. Usikkert om det er figurer for spill eller portretter |
| db16 RPG Character Sprites v2 (OpenGameArt) | Ja | Ukjent | CC0 | 16×24, 16 farger |
| Winter NPCs (Maru) | Ukjent | 4 retninger | Ukjent | 16×16 med vinterklær, ca. 7 dollar |

**Eget lagsystem (prototype 2026-11-02).** Vi kan tegne lagene selv i
Tiny Dungeon-stil: 16 × 16, samme palett og mørk kant. Hvert lag er et kart
med roller (hud, hår, klær, lue), og fargene velges av deltakeren. Første
versjon har 4 hudfarger, 5 frisyrer (blant dem skjegg), 6 hårfarger,
4 overdeler (blant dem nissedrakt), 5 luer, skjerf, votter og lykt, og en
enkel pusteanimasjon. Bare forfra, som Tiny Dungeon. Ingen lisensproblemer,
og den samme koden kan tegne figuren både i spillet og i Studio.

**Viktig om lisens:** spillet deles som kildekode, så alle deltakere får
bildefilene i repoet. Det regnes ofte som å gi grafikken videre, som mange
betalte lisenser forbyr. CC0 er tryggest; CC-BY-SA går hvis vi krediterer.

Arbeid for figurskaperen: ca. 3–4 dagsverk (startverdi), pluss bytte av
grafikk hvis pakken krever det.

## Se hverandre uten server

Vi starter uten en sanntidsserver. To ting gjør at bygda føles befolket:

1. **Lese hverandres prosjekter.** Hver deltaker har et Sanity-prosjekt.
   `npm run setup` gjør datasettet offentlig, så spillet kan lese de andres
   publiserte innhold med bare `projectId`. Slik ser du kulene, våpnene og
   figurene deres.
2. **Spøkelser.** Spillet lagrer jevnlig hvor du er, i ditt eget prosjekt.
   De andre ser figuren din der du var sist, med navn og «for 2 t siden».

Skrivingen går gjennom den lokale Next-serveren i spillet, så tokenet aldri
kommer til nettleseren. Det eneste felles vi trenger, er **lista over
deltakere** (navn og `projectId`).

Senere, hvis vi vil se hverandre gå rundt i sanntid: Sanitys
sanntidslytter i et felles prosjekt, eller en liten WebSocket-tjeneste på
Cloudflare Durable Objects. Vercel kan ikke holde WebSockets åpne.

### Å finne ut før vi bygger

| Spørsmål | Forslag |
|---|---|
| Hvor ligger deltakerlista? | En JSON-fil i repoet, eller ett felles Sanity-prosjekt |
| Hvordan kommer man på lista? | `npm run setup` melder deg på |
| Trengs innlogging? | Nei, navn og `projectId` er nok internt |
| Vet deltakerne at datasettet er offentlig? | Setup sier det. Ingenting privat skal i det |
| Kan man være skjult? | Ja, et valg i setup |
| CORS | Alle kjører på `localhost:3000`, så setup legger det til én gang |
| Andres innhold er halvferdig eller feil | Spillet sjekker alt det leser og hopper over det som ikke passer |
| Ett prosjekt svarer ikke | Det utelates, resten virker |
| Hvor mye fra andre vises? | En grense per deltaker, for eksempel siste 3 kuler og 1 våpen (startverdi) |
| Hvor lenge vises et spøkelse? | De som har spilt siste 24 timer (startverdi) |
| Hvordan ser et spøkelse ut? | Litt gjennomsiktig, med navn og tid |
| Kan arrangøren skjule en kule eller en person? | Ja, en liste over skjulte i det felles |
| Viser vi hvor mange oppgaver andre har gjort? | Nei, bare det de har laget |
| Ekte navn eller valgt navn? | Valgt navn, foreslått fra Sanity-brukeren |

## GROQ-oppgaver

Én GROQ-oppgave er obligatorisk (uke 2). Resten er bonus, så mange man vil.

- **Ett felles eksempeldatasett** (for eksempel et julemarked med boder og
  varer) i et offentlig Sanity-prosjekt vi eier. Alle får samme svar.
- **Sjekken kjører lokalt:** `npm run quest` kjører spørringen mot datasettet
  og sammenligner resultatet med en lagret fasit (som en hash, så svaret ikke
  står i koden).
- **Tre nivåer:** lett, middels, vanskelig. Rundt 15 til sammen, 3–4 nye hver
  mandag.
- **Arbeid:** datasett og sjekk ca. 1 dag, deretter 10–15 minutter per oppgave.

## Kjøring

**Testet 2026-10-30:** Studio-panelet virker bare når spillet og Studio kommer
fra samme sted. Derfor kjører **spillet og Studio hos deltakeren**
(`npm run dev`), eller i Codespaces for dem som ikke vil installere noe.

Spillet virker alene. Det felles (deltakerlista og andres innhold) dukker opp
når det svarer.

## Gjennomføring

| Rolle | Hvem | Hva |
|---|---|---|
| Arrangør | 1–2 | Spillet, deltakerlista, utgivelser, fredagsgjennomgang |
| Oppgaveforfatter | 2–4 som har lyst | Én oppgave hver, etter malen under |
| Tester | 2–3 | Spiller hver uke på forhånd og tar tiden ([gjennomspilling.md](gjennomspilling.md)) |

**Ferdig-kriterier for en oppgave:** kort tekst fra Brann, mål, «Hvor du
jobber», tre hint med lenker til dokumentasjonen, lærdom, automatisk sjekk,
løsning som egen commit tagget `solution/<id>`, testet av én person på høyst
25 minutter, og `npm run verify-release -- --build` er grønn.

| Uke | Arbeid før 30. november |
|---|---|
| 45 | Ta valgene. Uker i stedet for luker i spillet. Sjekk når filen lagres |
| 46 | Lista per uke og hjørnekortet. Velg spritepakke. Monstre i spillet og uke 2 |
| 47 | Figurskaperen. Deltakerliste, offentlige datasett, julekuler og spøkelser. Uke 3. Test av uke 1–2 |
| 48 | Test av uke 3. Buffer. Invitasjon og oppsettøkt fredag 27. november |

**Minimum som er godt nok:** uke 1 og 2 med lista og GROQ-oppgaven. Julekuler,
spøkelser og uke 3 kan komme underveis, eller kuttes.

## Risikoer

| Risiko | Hva vi gjør |
|---|---|
| Deltakere stopper på oppsettet | Oppsettøkt, `npm run doctor`, Codespaces |
| Prosjektet slettes etter 72 timer | Claim i oppsettøkta |
| Oppgavene tar lengre tid enn planlagt | Testere tar tiden; over 35 min blir bonus |
| Vi rekker ikke alt | Minimum fungerer alene, kolleger kan ta oppgaver |
| Andres innhold får spillet til å krasje | Alt fra andre sjekkes og hoppes over hvis det ikke passer |
| Noen legger noe upassende på treet | Arrangøren kan skjule kuler og personer |
| Kvoter i Sanity | Les andres innhold via CDN, sjeldent, og bare det vi viser |
| Hemmeligheter lekker | Tokens bare i miljøvariabler på den lokale serveren. Claim-lenken er personlig |

## Beslutninger vi trenger

- [x] Tre uker med fire oppgaver og én bonus, åpner mandag (2026-11-02)
- [x] Lista per uke som oversikt (2026-11-02)
- [x] Ingen poeng. Bygda pyntet fra start (2026-11-02)
- [x] Se hverandre gjennom offentlige datasett og spøkelser, ingen server ennå (2026-11-02)
- [ ] Skal kolleger lage oppgaver? Hvem spør vi?
- [ ] Hvor ligger deltakerlista, og hvem eier den?
- [ ] Er det greit at datasettene er offentlige?
- [x] Egen figur før uke 1, i en ferdig og gjennomført figurskaper (2026-11-02)
- [ ] Hvilken spritepakke bruker vi til figurene?
- [ ] Skal løsningen vises i spillet, eller bare som lenke til koden?
