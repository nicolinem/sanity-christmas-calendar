# Plan for Sanity-julekalenderen

Hvordan desember kan se ut, hvilke oppgaver som bør med, og hvordan vi får det
gjennomført med ansatte som har lyst. Tekniske beslutninger står i
[utviklingsplan.md](utviklingsplan.md). Plottet og Branns replikker står i
[historie.md](historie.md). Hvordan desember kjøres, står i
[gjennomforing.md](gjennomforing.md). Skissene ligger i Claude Design
(«Sanity-julekalenderen: skisser»).

Oppdatert 2026-11-06: kalenderen har ikke 24 daglige luker. Hovedløypa går i
rekkefølge; deltakeren kan be om fasit og gå videre uten å fullføre, og kan
komme tilbake til den luka senere. Det finnes to parallelle løyper: teknisk og
ikke-teknisk. Poeng er med; felles fremgang vises i deltakeroversikten, ikke
ved at bygda gradvis lyser opp.

---

## Kort fortalt

En julekalender med tre uker for 5–15 kolleger. Den er frivillig og gjøres på
egen tid. Hver mandag åpner et nytt kapittel. Hver deltaker velger teknisk
eller ikke-teknisk løype; lukene i valgt løype tas i rekkefølge. Pikselspillet
viser resultatene, framgangen og poengene. Kodeoppgaver skal helst sjekkes
automatisk; terminalbasert sjekk er reserve for oppgaver der det er nødvendig.

- **Før start:** oppsettøkt fredag 27. november, der alle også lager figuren
  sin.
- **Mandag:** ukas oppgaver åpner. Et kort i spillet viser dem, og vi poster i
  kanalen.
- **I løpet av uka:** målbildet er tre korte kjerneoppgaver og valgfri bonus
  per løype. Ingen frist; kapitlene åpnes ukentlig og står åpne ut desember.
- **Fredag:** løsningene kommer i spillet og i kanalen.
- **Poeng og nivå viser egen innsats.** Ingen toppliste i første versjon.
- **Felles oversikt:** se deltakernes figurer, nivå/fremgang og utvalgte ting
  de har laget eller fått til. Dette er en egen oversikt, inspirert av
  deltakerkort og aktivitetsliste; juletre kan være én visning, ikke et krav.
- **To løyper:** tekniske oppgaver og en egen ikke-teknisk løype med innhold
  og grunnleggende Sanity-konsepter. Oppgavene og belønningene i løypene
  utformes separat, men bidrar til samme felles opplevelse.

Tre kjerneoppgaver per løype er ca. 1 time (startverdi). Vi justerer når
testerne har tatt tiden på uke 1. Hvordan desember kjøres i praksis, står i
[gjennomforing.md](gjennomforing.md).

## Hva en god oppgave er

1. **Ett nytt Sanity-tema.** Ikke to.
2. **Synlig resultat** i spillet eller i Studio.
3. **Automatisk sjekk.** Innhold sjekkes i spillet; kode sjekkes ved lagring
   der det er robust. `npm run quest` er reserve, ikke den forventede
   deltakerflyten.
4. **Høyst 25 minutter** for en som ikke har sett den. Over 35 blir den bonus.
5. **Virker på gratisplanen** i Sanity.
6. **Bygger bare på det deltakeren har sett før** i tidligere luker. Lukene
   åpnes i rekkefølge. Deltakeren kan be om fasit, gå videre og senere gå
   tilbake til en hoppet over luke.
7. **Gjenbruker det spillet allerede har.** Hver uke får én ny ting i spillet
   (for eksempel monstre), og flere oppgaver bygger på den.

### Balanse i en uke

Hver løype vurderes for seg; den ikke-tekniske løypa skal ikke være en
forenklet eller poengmessig mindreverdig utgave av den tekniske.

1. **En trapp:** lett, middels og utfordrende oppgave, med valgfri bonus.
2. **Rundt én time** for kjerneoppgavene i hver løype. Oppgaver over 25 minutter
   for en førstegangsdeltaker forenkles eller flyttes til bonus.
3. **Synlig resultat:** minst to kjerneoppgaver gir noe deltakeren kan se i
   Studio, spillet eller deltakeroversikten.
4. **Variasjon:** teknisk løype har høyst én oppgave som krever en ny React-
   komponent. Ikke-teknisk løype bruker ikke krav om egen kode.
5. **Bonus går dypere** uten å være nødvendig for neste luke eller finalen.

Over alle tre ukene bør teknisk løype dekke Studio, skjema, React og GROQ,
mens ikke-teknisk løype dekker publisering, strukturering og bruk av innhold.
Læringsmål og konkrete oppgaver for begge løyper mangler fortsatt. Uke 1s
tidligere pitch er historisk og må revideres:
https://claude.ai/artifact/CgjW2uFneNYbhMvFJ4UBaF

For å vurdere en oppgave før den bygges: skillen `luke-design`
(`.claude/skills/luke-design`) og [spillvurdering.md](spillvurdering.md).

## Oppgavene

★ oppgave, ☆ bonus. Datoene gjelder 2026.

### Uke 1: Studio (åpner mandag 30. november)

|     | Sanity-tema          | Hva deltakeren gjør                             | Sjekk            |
| --- | -------------------- | ----------------------------------------------- | ---------------- |
| ★   | Documents og Publish | Lager og publiserer et våpen, ser det i spillet | Spillet          |
| ★   | `icon` og `preview`  | Viser ikon og sprite i dokumentlista            | Når filen lagres |
| ★   | Validation           | Påkrevd sprite for våpen, unike navn            | Når filen lagres |
| ★   | Custom input         | Velger som viser pikselkunsten                  | Når filen lagres |
| ☆   | Document view        | Egen fane som viser våpenet slik spillet gjør   | Når filen lagres |

Besluttet 2026-11-06: custom input er kjerneoppgave i den tekniske løypa.
Tabellen er fortsatt et utkast: den viser fire mulige kjerneoppgaver mot
målbildet på tre. Før implementering må vi velge tre, eller slå sammen to
uten å blande læringsmål. Uke 1 i den ikke-tekniske løypa får egne, likeverdige
oppgaver om innhold og grunnleggende Sanity-bruk; de er ikke spesifisert ennå.
Document action («Smi»-knappen) flyttes til uke 3.

### Uke 2 og 3: utkast; må avklares før bygging

Tabellene under er eldre utkast, ikke vedtatt oppgavesett. De har for mange
kjerneoppgaver og dekker bare den tekniske løypa. Før bygging fastsettes
læringsmål og oppgaver for begge løyper. Prosjektansvarlig velger pensum.

### Uke 2: Innholdsmodellering (åpner mandag 7. desember)

Ny ting i spillet: monstre fra innhold, med kamp og bytte (ca. 2,5 dagsverk).

|     | Sanity-tema         | Hva deltakeren gjør                                     | Sjekk                   |
| --- | ------------------- | ------------------------------------------------------- | ----------------------- |
| ★   | Ny document type    | Lager en `monster`-type. Monstrene dukker opp i spillet | Spillet                 |
| ★   | `reference` og `->` | Kobler et monster til gjenstandene det slipper          | Spillet                 |
| ★   | GROQ i Vision       | Den ene obligatoriske GROQ-oppgaven                     | Resultatet sammenlignes |
| ★   | `image` og assets   | Tegner sin første julekule og laster den opp            | Spillet                 |
| ☆   | GROQ                | Frivillige GROQ-oppgaver                                | Resultatet sammenlignes |

Monstrene følger en fast kontrakt, og spillet avgjør HP og skade: `name`,
`kind`, `size`, `sprite`, `weakness`, `drops`.

### Uke 3: Utover skjemaet (åpner mandag 14. desember)

|     | Sanity-tema               | Hva deltakeren gjør                                    | Sjekk                       |
| --- | ------------------------- | ------------------------------------------------------ | --------------------------- |
| ★   | Document action           | Egen «Smi»-knapp som setter et tidspunkt og publiserer | Spillet                     |
| ★   | Portable Text             | Tekst med egne marks som vises i spillet               | Når filen lagres og innhold |
| ★   | Functions                 | Fyller et felt automatisk ved publisering (30–45 min)  | Spillet                     |
| ★   | Offentlig dataset og GROQ | Henter en kollegas julekuler fra deres prosjekt        | Spillet                     |
| ☆   | Custom input              | Lager tegnebrettet for julekuler selv                  | Når filen lagres            |

Functions krever claimet prosjekt og `npx sanity login`. Den siste
★-oppgaven bruker det samme som gjør at deltakerne ser hverandre (se under).

### Uka før jul

Ingen nye oppgaver. Deltakeroversikten viser hva folk har laget og hvor langt
de har kommet. En uformell fremvisning kan være frivillig; ingen oppgave eller
felles funksjon skal være nødvendig for å oppleve finalen alene.

### Pensum og pitch

Før uke 2 og 3 avgjøres, svarer vi på:

1. **Hva skal en deltaker kunne etter desember?** Tre til fem læringsmål,
   skrevet som noe man kan gjøre på jobb («Modellere innhold med
   `reference`», ikke «Kjenne til references»).
2. **Hvilke Sanity-temaer dekker målene?** Hvert tema vurderes etter
   reglene i «Hva en god oppgave er».
3. **To eller tre alternativer for uke 2 og 3,** hver med tre oppgaver og
   bonus, hva det koster å bygge, og hva man lærer.

Prosjektansvarlig velger. Pitchen skjer senest fredag 6. november, så uke 2
og 3 kan bygges i uke 46 og 47.

### I reserve

Kan bytte inn en oppgave som ikke fungerer, eller bli ekstra bonus.

| Idé                  | Merknad                                                |
| -------------------- | ------------------------------------------------------ |
| Content migration    | Endre formen på et felt og migrere innholdet           |
| TypeGen              | Generere typer og bruke `defineQuery`                  |
| Singleton            | Ett innstillingsdokument som styrer noe i spillet live |
| Agent Actions        | Bruker AI-kreditter; sjekk hvor mange gratisplanen har |
| `definePlugin`       | Pakke en custom input som plugin                       |
| App SDK              | Egen app med oversikt over innholdet                   |
| GROQ-powered webhook | Krever en felles tjeneste og lov til å poste i Slack   |

### Kuttet

| Idé                               | Grunn                                                                           |
| --------------------------------- | ------------------------------------------------------------------------------- |
| Content Releases                  | Enterprise-tillegg, ikke på gratisplanen                                        |
| Scheduled drafts, Comments, Tasks | Ikke på gratisplanen                                                            |
| Presentation / Visual Editing     | For mye arbeid å få klikkbare overlays i et canvas-spill                        |
| 24 luker, én per dag              | Oppgavene følger tre ukentlige kapitler; kalenderen viser ikke 24 daglige luker |

---

## Grensesnittet

- **Kalenderen** viser tre ukentlige kapitler, ikke 24 daglige luker. Nye
  kapitler åpner på dato; lukene i valgt løype tas i rekkefølge.
- **Brann er veiviser.** Han deler ut luka og peker til stedet i bygda. Stedet
  er valgfritt; mål, hint og kodevindu er tilgjengelig fra Brann og journalen.
- **J åpner kartet.** Journalen viser luker og lærdommer via egen knapp. Kartet
  viser hvor åpne, fullførte og låste luker ligger; «Gå til» bruker den
  eksisterende klikk-for-å-gå-bevegelsen. Senere luker er låst fram til den
  aktive er fullført eller hoppet over.
- **Mandag:** et kort med ukas oppgaver, én gang.
- **Luke ferdig:** tydelig tilbakemelding, lærdom og poeng, deretter neste luke.
- **Gi opp:** vis fasit/veiledning, merk luka som hoppet over, og åpne neste.
  Den hoppede luka kan åpnes fra loggen senere; ved fullføring får deltakeren
  den ordinære belønningen.
- **Fasit:** tilgjengelig fra luka når den er sluppet. Fasit er veiledning, ikke
  en skjult belønning som må låses opp ved å tape poeng.
- **Fellesoversikt:** kort per deltaker med valgt figur, nivå/fremgang og
  utvalgte synlige resultater. Ikke toppliste i første versjon.
- **Karakterer:** en kjent karakter gir neste oppgave i hver ukesdel. Om en ny
  karakter introduseres i uke 2 eller 3 avgjøres i historie-/oppgavepitchen.

## Fremgang

Fremgangen vises på tre måter:

1. **Det du lager, finnes i spillet.** Våpen, monstre og bilder fra Studio.
   Dette er kjernen og finnes allerede.
2. **Poeng og nivå.** Poeng viser fullførte oppgaver og gir en enkel
   progresjonsmåler. Poeng gis ikke for fasit eller antall hint; den nøyaktige
   poengverdien og nivågrensene bestemmes etter en kort spilltest. De er
   lekne spilldata, ikke en verifisert rangering eller grunnlag for premier.
   Utvikleroverstyringer (`?dev`) skal ikke publiseres i deltakeroversikten.
   Ikke bruk poeng som adgangskrav til oppgaver eller finalen.
3. **Felles deltakeroversikt.** Andre kan se valgt figur, nivå/fremgang og
   utvalgte publiserte resultater. Valgt navn og synlighet må være frivillig;
   oversikten skal ikke vise privat prosjektinnhold eller aktivitetsposisjon.

### Egen figur

Figurskaperen er ingen oppgave. Den er ferdig laget av oss, og skal vise hvor
bra en _custom input_ i Studio kan bli. Senere lager deltakeren enklere
varianter selv (sprite-velgeren i uke 1, tegnebrettet i uke 3). Krav og
replikker står i [historie.md](historie.md).

Den trenger en spritepakke med figurer i lag (kropp, hår, klær, lue):

| Pakke                         | Lisens         | Merknad                                                                                  |
| ----------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| Kenney «Roguelike Characters» | CC0            | Gratis og samme kilde som resten. Sjekk at den har lag, og at stilen passer Tiny Dungeon |
| LPC (Liberated Pixel Cup)     | CC-BY-SA / GPL | Svært mange lag, men større figurer og annen stil. Krever kreditering                    |
| Betalte pakker (itch.io)      | Varierer       | Ofte finest, og ofte med vinterklær. Les lisensen                                        |

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

| Pakke                                        | Lag                | Gange                 | Lisens                          | Merknad                                                                                          |
| -------------------------------------------- | ------------------ | --------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------ |
| Mana Seed Character Base (Seliel the Shaper) | Ja, mange          | Ja, mange animasjoner | Egen lisens, betal hva du vil   | Mange tilleggsklær. Lisensen forbyr å gi grafikken videre                                        |
| LPC Character Generator                      | Ja, svært mange    | 4 retninger           | CC-BY-SA / GPL / OGA-BY per lag | Generatoren lager kredittliste. Større figurer og annen stil. Ligger på GitHub, så kan testes nå |
| nonemo «Character Creation Asset Pack»       | 45 hår, 28 antrekk | Ukjent                | CC0                             | Gratis. Usikkert om det er figurer for spill eller portretter                                    |
| db16 RPG Character Sprites v2 (OpenGameArt)  | Ja                 | Ukjent                | CC0                             | 16×24, 16 farger                                                                                 |
| Winter NPCs (Maru)                           | Ukjent             | 4 retninger           | Ukjent                          | 16×16 med vinterklær, ca. 7 dollar                                                               |

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

Vi starter uten en sanntidsserver. Første versjon er en deltakeroversikt med
figurer, nivå/fremgang og utvalgte resultater; den trenger ikke vise live-
bevegelser eller «sist sett».

1. **Lese delbare resultater.** Hver deltaker har sitt Sanity-prosjekt.
   Deltakeren må forstå og godta hva som blir offentlig før deling slås på.
   Spillet leser bare de feltene og publiserte dokumentene som trengs for
   oversikten.
2. **Valgt figur og visningsnavn.** Deltakeren velger om vedkommende vises og
   hvilket navn som vises. Skjult eller utilgjengelig deltaker påvirker ikke
   egen progresjon.

Ingen token skal sendes til nettleseren. Før implementering må vi velge hvor
deltakerlista ligger, hvem som eier den, hvordan deltakeren melder seg på og
av, og hvordan arrangøren skjuler upassende innhold. Ikke lagre siste posisjon
eller aktivitetsstatus i første versjon.

Senere, hvis vi vil se hverandre gå rundt i sanntid: Sanitys
sanntidslytter i et felles prosjekt, eller en liten WebSocket-tjeneste på
Cloudflare Durable Objects. Vercel kan ikke holde WebSockets åpne.

### Å finne ut før vi bygger

| Spørsmål                                      | Forslag                                                                    |
| --------------------------------------------- | -------------------------------------------------------------------------- |
| Hvor ligger deltakerlista?                    | Avgjøres før bygging; velg eier og minste mulige lagring                   |
| Hvordan kommer man på lista?                  | Frivillig påmelding med tydelig samtykke                                   |
| Trengs innlogging?                            | Må vurderes ut fra valgt løsning; ikke anta at `projectId` er identitet    |
| Vet deltakerne at dataene er offentlige?      | Samtykke og forklaring før opt-in                                          |
| Kan man være skjult?                          | Ja; standard og enkel avmelding må bestemmes                               |
| CORS                                          | Alle kjører på `localhost:3000`, så setup legger det til én gang           |
| Andres innhold er halvferdig eller feil       | Spillet sjekker alt det leser og hopper over det som ikke passer           |
| Ett prosjekt svarer ikke                      | Det utelates, resten virker                                                |
| Hvor mye fra andre vises?                     | En grense per deltaker, for eksempel siste 3 kuler og 1 våpen (startverdi) |
| Viser vi sist sett eller posisjon?            | Nei, ikke i første versjon                                                 |
| Kan arrangøren skjule innhold eller deltaker? | Må inngå i modereringsbeslutningen før deling bygges                       |
| Viser vi fremgang?                            | Ja, nivå/poeng og utvalgte resultater; ingen rangering                     |
| Ekte navn eller valgt navn?                   | Valgt visningsnavn; ekte navn skal ikke hentes automatisk                  |

## GROQ-oppgaver

Utkastet har én obligatorisk GROQ-oppgave i uke 2; det avgjøres i pitchen.
Resten er bonus, så mange man vil.

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

| Rolle             | Hvem             | Hva                                                                                 |
| ----------------- | ---------------- | ----------------------------------------------------------------------------------- |
| Arrangør          | 1–2              | Spillet, deltakerlista, utgivelser, kanalen                                         |
| Oppgaveforfatter  | 2–4 som har lyst | Én oppgave hver, etter malen under                                                  |
| Tester            | 2–3              | Spiller hver uke på forhånd og tar tiden ([gjennomspilling.md](gjennomspilling.md)) |
| Prosjektansvarlig | 1                | Velger pensum for uke 2 og 3                                                        |

Arrangørene har mer enn 2 dager i uka til dette fram til start.

**Ferdig-kriterier for en oppgave:** kort tekst fra Brann, mål, «Hvor du
jobber», tre hint med lenker til dokumentasjonen, lærdom, automatisk sjekk,
løsning som egen commit tagget `solution/<id>`, testet av én person på høyst
25 minutter, og `npm run verify-release -- --build` er grønn.

### Plan fram til start

| Uke               | Pensum                                                                                                 | Spill og gjennomføring                                                                                                            | Figur og det felles                                                    | Test                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------- |
| 45 (3.–6. nov.)   | Lås læringsmål, rekkefølge, poeng og innhold for begge løyper; velg tre kjerneoppgaver i teknisk uke 1 | Lås progresjon og flyten for fasit, hopp over og ta igjen                                                                         | Bestem hva som vises på deltakerkort og hvem som eier fellesdata       |                                                             |
| 46 (9.–13. nov.)  | Skisser oppgaver for begge løyper i uke 1–3; test om omfang og læringsmål er realistiske               | Bygg progresjonsgrunnlaget først: løypevalg, ukentlige åpninger, luker i rekkefølge, hopp over/ta igjen og poeng                  | Bestem hvilke karakterer som gir oppgaver; avgjør frivillig deling     | Oppsettprøve på Mac, Windows og Codespaces                  |
| 47 (16.–20. nov.) | Ferdigstill tekst, hint, sjekk og fasit for begge løyper                                               | Ferdigstill uke 1 som en gjennomgående spillbar del, deretter kapittel 2–3; automatisk sjekk der mulig og CLI-reserve dokumentert | Bygg enkel deltakeroversikt bare hvis samtykke og datakilde er avklart | 2–3 testere fra hver målgruppe prøver uke 1 fra fersk klone |
| 48 (23.–27. nov.) | Frys omfang; klargjør kanalposter og løsningsveiledning                                                | Rett releaseblokkere; ikke legg til unødvendige mekanikker                                                                        | Slipp bare testet deltakeroversikt; utsett spøkelser/sanntid           | Begge løyper gjennomspilles; oppsettøkt og releasekandidat  |

**Hvis tiden ikke strekker til, kuttes i denne rekkefølgen:** spøkelser og
sanntid, ekstra bonusoppgaver, avansert fellesoversikt og ekstra spillmekanikk.
Begge løypene må fortsatt ha en gjennomførbar vei gjennom alle kapitlene; hvis
det ikke er realistisk, må releaseomfang eller invitasjon besluttes på nytt.

**Minimum som er godt nok:** begge løypene har en testet, sammenhengende
oppgaverekke gjennom kapitlene, med poeng/status, fasit/skip/ta-igjen,
fungerende oppsett og en finale som virker alene. Fellesoversikten kan være
en enkel deltakerliste med opt-in profilkort.

## Risikoer

| Risiko                                  | Hva vi gjør                                                                                        |
| --------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Deltakere stopper på oppsettet          | Oppsettøkt, `npm run doctor`, Codespaces                                                           |
| Folk faller av fordi det er på egen tid | To løyper, ingen frist, kapitler åpne ut desember, fasit og mulighet til å ta igjen                |
| Prosjektet slettes etter 72 timer       | Claim i oppsettøkta                                                                                |
| Oppgavene tar lengre tid enn planlagt   | Testere tar tiden; over 35 min blir bonus                                                          |
| Vi rekker ikke begge løypene godt nok   | Kutt bonus og sanntid; endre releaseomfang eller invitasjon framfor å late som begge spor er klare |
| Andres innhold får spillet til å krasje | Alt fra andre sjekkes og hoppes over hvis det ikke passer                                          |
| Noen deler upassende innhold            | Opt-in og modererings-/skjulemulighet må være avklart før deltakeroversikten åpnes                 |
| Kvoter i Sanity                         | Les andres innhold via CDN, sjeldent, og bare det vi viser                                         |
| Hemmeligheter lekker                    | Tokens bare i miljøvariabler på den lokale serveren. Claim-lenken er personlig                     |

## Beslutninger vi trenger

- [x] Tre uker, åpner mandag (2026-11-02)
- [x] Tre oppgaver og bonus per uke, i stedet for fire (2026-11-03)
- [x] Frivillig og på egen tid. Ingen frist, ingen faste møter utenom oppsettøkta (2026-11-03)
- [x] Lista per uke som oversikt (2026-11-02)
- [ ] Poeng og nivå: poeng for reell fullføring, verdier og nivågrenser testes før de låses
- [ ] Kan deltakeren bytte løype etter start, og hvordan vises framgang i den andre løypa?
- [x] Alle ukene i koden fra start, datoen åpner dem (2026-11-03)
- [x] Lukeprogresjon er sekvensiell; fasit/gi opp åpner neste luke, hoppet over luke kan tas senere (2026-11-06)
- [x] Uke 1 teknisk løype: custom input er kjerneoppgave (2026-11-06)
- [ ] Ikke-teknisk løype: læringsmål og oppgaver for alle tre ukene
- [ ] Uke 2 og 3: alternativer pitches for prosjektansvarlig senest 6. november
- [ ] Fellesoversikt: hva som deles, samtykke, lagring, eier og moderering
- [ ] Poeng: belønning for fullføring og håndtering av fasit/hoppet over
- [ ] Kanal: antakelig Viva Engage, avklares
- [ ] Skal kolleger lage oppgaver? Hvem spør vi?
- [ ] Hvor ligger deltakerlista, og hvem eier den?
- [x] Egen figur før uke 1, i en ferdig og gjennomført figurskaper (2026-11-02, bekreftet 2026-11-03)
- [ ] Hvilken grafikk bruker vi til figurene?
- [ ] Skal løsningen vises i spillet, eller bare som lenke til koden?
