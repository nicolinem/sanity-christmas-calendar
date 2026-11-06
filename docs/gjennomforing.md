# Gjennomføring: fra invitasjon til jul

Hvordan kalenderen kjøres, hva som kan gå galt for en deltaker underveis, og
hva vi gjør med det. Oppgavene og planen fram til start står i
[questplan.md](questplan.md), plottet i [historie.md](historie.md).
Utkast 2026-11-03.

**Rammene:** 5–15 deltakere, både tekniske og ikke-tekniske. Frivillig og på
egen tid. Deltakeren velger én av to løyper; begge følger samme ukentlige
historie, men har egne oppgaver. Omfang og tidsbruk for hver løype må testes.

---

## Målet

Tre ting skal holde for alle deltakere:

1. **Ingen står fast på noe som ikke er Sanity.** Oppsett, git, nettverk og
   verktøy bare virker. Det man bruker tid på, er det man skal lære.
2. **Ingen står fast lenge.** Etter 10 minutter uten fremgang finnes det
   alltid et neste steg (startverdi).
3. **Hver oppgave viser noe i løpet av de første 5 minuttene** (startverdi).
   Et dokument i Studio, noe i spillet, en melding fra sjekken.

Fordi det er på egen tid, er det verste som kan skje ikke at noen står fast
én gang, men at de gir opp og ikke kommer tilbake.

## Regler

- **Kalenderen har tre ukentlige kapitler, ikke 24 daglige luker.** Kapitler
  åpnes på dato. Progresjonen i valgt løype går gjennom lukene i rekkefølge.
  Alle kapitlene kan ligge i koden fra start; `git pull` trengs for feilrettinger.
- **Deltakeren kan hoppe over en luke uten å bli låst.** «Jeg står fast» gir
  flere hint, fasit når den er tilgjengelig og valg om å gå videre. Luka står
  som hoppet over og kan løses senere; da registreres fullføring og poeng.
- **Poeng belønner fullføring, ikke fart eller få hint.** Ingen toppliste i
  første versjon. Å hoppe over gir ikke fullføringspoeng, men låser ikke
  deltakeren ute fra resten av løypa.
- **Ingen frist.** Alt står åpent ut desember. Den som hopper over en uke,
  kan ta den igjen.
- **Spillet virker alene.** Det felles (andres kuler, spøkelser) er pynt. Hvis
  det ikke svarer, merker deltakeren det ikke.
- **Én kanal for alt.** Antakelig Viva Engage (avklares). Der poster vi,
  svarer på spørsmål og deler løsninger.
- **Ingen faste møter** utenom oppsettøkta. Kanskje en eller to uformelle
  samlinger i desember, uten noe som må forberedes.

## Deltakerens vei gjennom desember

### Før start

| Hva skjer                   | Hva kan gå galt                  | Hva vi gjør                                                                                 |
| --------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------- |
| Invitasjon i uke 47         | Folk vet ikke hva de sier ja til | Invitasjonen sier: frivillig, ca. 1 time per uke, egen maskin, ingen Sanity-erfaring trengs |
| Påmelding                   | Vi vet ikke hvem som kommer      | Påmelding gir antall til oppsettøkta og deltakerlista                                       |
| Deltakeren sjekker maskinen | Feil versjon av Node, ingen git  | Invitasjonen lenker til en sjekkliste, og `npm run doctor` sier hva som mangler             |

### Oppsett (fredag 27. november)

| Hva skjer                              | Hva kan gå galt                                                                                                                                                                                                      | Hva vi gjør                                                                                         |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `git clone` og `npm install`           | Kontornettet sperrer noe (itch.io er allerede sperret)                                                                                                                                                               | Test hele oppsettet på kontornettet i uke 46                                                        |
| `npm run setup`                        | Stopper halvveis; kjøres to ganger                                                                                                                                                                                   | Setup kan kjøres på nytt uten å ødelegge noe                                                        |
| Datasettet er offentlig                | Deltakeren vet ikke at andre kan lese det                                                                                                                                                                            | Setup sier det tydelig. Ingenting privat skal i det                                                 |
| Claim av prosjektet                    | Glemt, og prosjektet slettes etter 72 timer                                                                                                                                                                          | Claim er et eget punkt i økta. Spillet minner om det til det er gjort                               |
| Første innlogging i Studio             | Studio i panelet viser Sanitys innlogging. GitHub og Google nekter å vises i et panel («github.com avviste tilkoblingsforsøket»), og et prosjekt som ikke er claimet, har uansett ingen brukere (skjedde 2026-11-03) | Panelet viser innloggingslenken fra setup i stedet for Sanitys knapper, og én kommando åpner lenken |
| `npm run dev`                          | Port 3000 er opptatt                                                                                                                                                                                                 | `npm run doctor` sjekker porten og sier hva som bruker den                                          |
| Windows                                | Skriptene er bare testet på Mac                                                                                                                                                                                      | Én tester på Windows i uke 46                                                                       |
| Kan ikke eller vil ikke installere noe | Låst maskin, eller ikke utvikler                                                                                                                                                                                     | Codespaces, testet på forhånd                                                                       |
| Lager figuren i figurskaperen          | Første møte med Studio er forvirrende                                                                                                                                                                                | Figurskaperen er det første man gjør, og den skal være det fineste i Studio                         |

Oppsettet er ferdig når spillet kjører, Studio åpner, figuren står i bygda,
og et testvåpen vises i spillet. Den som ikke kom på økta, følger samme
sjekkliste alene.

### Mandag: en ny uke åpner

| Hva skjer               | Hva kan gå galt                                   | Hva vi gjør                                                         |
| ----------------------- | ------------------------------------------------- | ------------------------------------------------------------------- |
| Ukas oppgaver åpner     | Deltakeren åpner ikke spillet og merker ingenting | Post i kanalen mandag morgen, med ukas tema og én setning fra Brann |
| Mandagskortet i spillet | Vises for en som startet sent og har to uker åpne | Kortet viser alle åpne uker, ikke bare den nyeste                   |
| Spillet startes         | `npm run dev` er glemt                            | Posten i kanalen sier kommandoen                                    |

### I løpet av uka

| Hva skjer                              | Hva kan gå galt                                  | Hva vi gjør                                                                                              |
| -------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Åpner ei luke                          | Vet ikke hva som skjer eller hvor man skal jobbe | Ukas karakter sier mål og arbeidssted; neste luke åpnes etter fullføring eller «gå videre»               |
| Skriver kode                           | Halvferdig kode gir rød feil overalt             | Sjekken sier «Koden kjører ikke ennå», ikke «feil»                                                       |
| Ødelegger skjemaet                     | Studio viser bare en feilmelding                 | Studio-feilen gjelder bare Studio; spillet virker videre (må testes). Hint om hvordan man leser feilen   |
| Vil starte oppgaven på nytt            | Vet ikke hvilke filer som er endret              | Én kommando setter filene for én oppgave tilbake til start                                               |
| Sjekken sier nei, men løsningen virker | Frustrasjon, tror man har gjort feil             | Presis feilmelding, prøv igjen eller hopp over. Testerne prøver minst to ulike løsninger per kodeoppgave |
| Publiserer innhold                     | Glemmer `Publish`, ser ingenting i spillet       | Spillet ser drafts og sier «Du har et utkast som ikke er publisert»                                      |

### Står fast

En trapp. Hvert trinn er der før deltakeren trenger det:

1. Branns tekst og «Hvor du jobber».
2. Hint 1, 2 og 3, med lenker til dokumentasjonen.
3. Meldingen fra sjekken, som sier hva som mangler.
4. Spør i kanalen. Vi svarer innen en arbeidsdag (startverdi).
5. Hopp over og gå videre; den hoppede luka blir liggende i loggen for senere.
6. Se fasit når den slippes, og gå tilbake for å fullføre om ønskelig.

### Fredag

| Hva skjer                | Hva kan gå galt                    | Hva vi gjør                                                            |
| ------------------------ | ---------------------------------- | ---------------------------------------------------------------------- |
| Løsningene kommer        | Arrangøren glemmer å pushe taggene | Eget punkt i arrangørens uke, med en reserveperson                     |
| `git show solution/<id>` | Deltakeren kan ikke git godt nok   | «Se løsning» i spillet viser endringen, eller lenker til den på GitHub |
| Post i kanalen           | Blir bare en lenke                 | Posten sier hva som var vanskelig, og ber folk vise sin egen løsning   |

### Kommer sent eller hopper over en uke

Oppsettet kan gjøres alene med sjekklista. Kapitler åpner på dato, men en som
starter sent kan ta igjen tidligere kapitler. Inne i valgt løype går lukene i
rekkefølge. Å hoppe over en luke åpner neste; loggen viser hva som er
fullført, hoppet over og fortsatt mulig å ta igjen.

### Uka før jul og julaften

Ingen nye oppgaver. Mange har fri fra rundt 20. desember, så finalen må virke
for den som åpner spillet alene på julaften.

## Sjekken

- **Kjører når filen lagres.** `npm run dev` starter sjekken sammen med
  spillet. «Sjekk på nytt» og `npm run quest` finnes fortsatt.
- **Sjekker hva koden gjør, ikke hvordan den er skrevet.** Alle løsninger som
  virker, skal bestå.
- **Sier hva som mangler**, aldri bare «feil». Teksten testes på en som ikke
  har sett oppgaven.
- **Krasjer aldri spillet.** Feil i sjekken blir en melding, ikke en hvit side.

## Interessant og lærerikt

- **Hver oppgave svarer på «hvorfor ville jeg gjort dette på jobb?»** i
  lærdommen. Én setning, med et eksempel fra et ekte prosjekt.
- **Ikke-teknisk løype:** oppgavene handler om Sanity-innhold og grunnleggende
  konsepter, og krever ikke at deltakeren skriver kode. Den skal gi synlig
  resultat og samme historie/felles oversikt som teknisk løype.
- **Teknisk løype:** inkluderer custom input som kjerneoppgave i uke 1.
- **Tidsbruk måles per løype.** Oppgavene justeres ut fra tester, ikke fra
  antatt like tidsbruk i de to sporene.
- **Løsningene deles i kanalen på fredag.** Ulike løsninger på samme oppgave
  er der man lærer mest av hverandre.

## Arrangørens uke

| Når           | Hva                                                                                | Hvem              |
| ------------- | ---------------------------------------------------------------------------------- | ----------------- |
| Torsdag før   | Testerne har spilt uka og tatt tiden. `npm run verify-release -- --build` er grønn | Arrangør          |
| Mandag morgen | Post i kanalen (ferdigskrevet på forhånd)                                          | Arrangør, reserve |
| Hele uka      | Svar i kanalen innen en arbeidsdag                                                 | Arrangørene       |
| Fredag morgen | Push `solution/<id>` for ukas oppgaver, post i kanalen                             | Arrangør, reserve |

**Feilretting underveis:** rett på `main`, kjør `npm run verify-release`,
push, og post «Kjør `npm run update`» i kanalen. `npm run update` henter ny
kode, kjører `npm install` og sjekker at alt virker. Spillerfilene endres
aldri etter start, så det gir ingen konflikter.

## Før vi slipper: generalprøver

| Uke | Prøve                                                 | Godt nok når                                          |
| --- | ----------------------------------------------------- | ----------------------------------------------------- |
| 46  | Oppsett på kontornettet: Mac, Windows og Codespaces   | Under 20 minutter fra `git clone` til våpen i spillet |
| 47  | 2–3 testere spiller uke 1 og 2 fra en fersk klone     | Hver ★-oppgave under 25 minutter                      |
| 48  | Testere spiller uke 3                                 | Samme                                                 |
| 48  | Arrangøren øver på fredagen: pusher en tagg og poster | Tar under 5 minutter                                  |

Det som feiler i en prøve, rettes før invitasjonen går ut, eller oppgaven blir
bonus.

## Det som må bygges

| Hva                                                             | Hvorfor                                                                                                                            |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Åpning per uke i stedet for per dag                             | Motoren åpner i dag luke N etter N–1 dager                                                                                         |
| Sjekk når filen lagres                                          | Spillet svarer uten at man trenger terminalen                                                                                      |
| «Gi opp og gå videre» med fasit og mulighet til å ta igjen luka | En sjekk som tar feil eller en vanskelig oppgave stopper ingen                                                                     |
| Tilbakestill én oppgave                                         | Trygt å prøve og feile                                                                                                             |
| `npm run doctor` og `npm run update`                            | Oppsett og feilretting uten hjelp                                                                                                  |
| Innlogging i Studio uten felle                                  | En kommando som åpner innloggingslenken, og et panel som viser den i stedet for innlogging som ikke virker                         |
| Spillet ser upubliserte drafts                                  | Den vanligste feilen i uke 1 får en tydelig melding                                                                                |
| Ferdigskrevne poster til kanalen                                | Mandag og fredag går av seg selv                                                                                                   |
| Løsningene skrives om                                           | `solution/<id>` bruker fortsatt gamle navn («Laugets lov», «Prøvestua») og meldinger som «Et annet blad har allerede dette navnet» |

Når de bygges, står i planen i [questplan.md](questplan.md).

## Stegvis plan fram mot implementering

Dette er produktrekkefølgen. Tekniske detaljer beholdes i
[utviklingsplan.md](utviklingsplan.md); ikke start senere steg før
avhengighetene her er avklart.

| Steg                      | Resultat                                                                                    | Ferdig når / avhengighet                                                                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0. Lås produktet          | Læringsmål og oppgavesett for begge løyper; poengregel; deltakeroversikt, synlighet og eier | Hver luke har mål, læring, sjekk, belønning og løype. Fasit, hopp over og ta igjen er avtalt. Custom input er kjerneoppgave i teknisk uke 1.                               |
| 1. Progresjon             | Løypevalg, tre ukentlige kapitler og sekvensielle luker                                     | Fullfør, hopp over, gå videre, last inn på nytt og kom tilbake fungerer; poeng og status er forståelige. Ingen deling er nødvendig.                                        |
| 2. Uke 1 ende-til-ende    | Begge løypene kan spilles fra fersk klone                                                   | Testere fra begge målgruppene får synlig resultat og kan ta igjen en hoppet over luke. Kodeoppgaver sjekkes automatisk der det er mulig; CLI-sjekk er dokumentert reserve. |
| 3. Fellesoversikt         | Deltakerkort med valgt figur, nivå/fremgang og utvalgte resultater                          | Opt-in, avmelding/skjuling og feilhåndtering er testet. Privat data og sanntidsposisjon vises ikke.                                                                        |
| 4. Kapittel 2–3 og finale | Begge løyper og individuell avslutning er komplette                                         | Ukentlige tester og releasekontroll passerer. Finalen fungerer alene selv om fellesoversikten er tom eller utilgjengelig.                                                  |
| 5. Releaseprøve           | Oppsett, support, kommunikasjon og fasitflyt er øvd                                         | Ny deltaker kan starte uten muntlig hjelp; arrangøren kan publisere oppdatering og løsninger med reserveperson.                                                            |

Planen fra uke 45–48 må flyttes hvis steg 0 ikke er låst. To reelle løyper
øker oppgavearbeidet. Kutt først bonusinnhold og spøkelser/sanntid; ikke kutt
én av målgruppene uten å endre invitasjonen.

## Å bestemme

- [ ] Læringsmål og oppgaver for begge løyper, uke 2–3.
- [ ] Poengverdier og nivågrenser; fasit-/hopp over-/ta igjen-regler.
- [ ] Deltakeroversikt: datakilde, samtykke, eier og moderering.
- [ ] Kanal: antakelig Viva Engage.
