# Plan for Sanity-julekalenderen

Hvordan desember kan se ut, hvilke oppgaver som bør med, og hvordan vi får det
gjennomført med ansatte som har lyst. Tekniske beslutninger står i
[utviklingsplan.md](utviklingsplan.md). Plottet og Branns replikker står i
[historie.md](historie.md). Hvordan desember kjøres, står i
[gjennomforing.md](gjennomforing.md). Skissene ligger i Claude Design
(«Sanity-julekalenderen: skisser»).

Oppdatert 2026-11-09: kalenderen har ikke 24 daglige luker. Hovedløypa går i
rekkefølge; deltakeren må få godkjent sjekken før neste luke åpnes. Hint og
fasit hjelper deltakeren videre i den aktive luka, men erstatter ikke
fullføring. Det finnes to parallelle løyper: teknisk og ikke-teknisk. Poeng er
med; felles fremgang vises i deltakeroversikten, ikke
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
- **I løpet av uka:** hver løype får så mange kjerneoppgaver som læringsmålene
  trenger. Tidsmålet er omtrent én time per løype (startverdi); bonus er
  valgfri. Ingen frist; kapitlene åpnes ukentlig og står åpne ut desember.
- **Fredag:** løsningene kommer i spillet og i kanalen.
- **Poeng og nivå viser egen innsats.** Ingen toppliste i første versjon.
- **Felles oversikt:** se deltakernes figurer, nivå/fremgang og utvalgte ting
  de har laget eller fått til. Dette er en egen oversikt, inspirert av
  deltakerkort og aktivitetsliste; juletre kan være én visning, ikke et krav.
- **To løyper:** tekniske oppgaver og en egen ikke-teknisk løype med innhold
  og grunnleggende Sanity-konsepter. Oppgavene og belønningene i løypene
  utformes separat, men bidrar til samme felles opplevelse.

Omtrent én time per løype er en startverdi; antall oppgaver er ikke låst og
kan være ulikt mellom løypene. Vi justerer omfanget når testerne har tatt
tiden på uke 1. Hvordan desember kjøres i praksis, står i
[gjennomforing.md](gjennomforing.md).

## Hva en god oppgave er

1. **Ett nytt Sanity-tema.** Ikke to.
2. **Synlig resultat** i spillet eller i Studio.
3. **Automatisk sjekk.** Innhold sjekkes i spillet. I kodevinduet sjekkes koden
   automatisk etter en kort skrivepause, uten at deltakeren lagrer en fil.
   For kode i repoet er sjekk ved fillagring planlagt der det er robust;
   disse oppgavene bruker foreløpig `npm run quest`.
4. **Høyst 25 minutter** for en som ikke har sett den. Over 35 blir den bonus.
5. **Virker på gratisplanen** i Sanity.
6. **Bygger bare på det deltakeren har sett før** i tidligere luker. Lukene
   åpnes i rekkefølge, og neste luke åpnes først når sjekken for den aktive
   luka er bestått. Hint og fasit er tilgjengelig uten å omgå sjekken.
7. **Gjenbruker det spillet allerede har.** Hver uke får én ny ting i spillet
   (for eksempel monstre), og flere oppgaver bygger på den.

### Balanse i en uke

Hver løype vurderes for seg; den ikke-tekniske løypa skal ikke være en
forenklet eller poengmessig mindreverdig utgave av den tekniske.

1. **En trapp:** gå fra enklere til mer utfordrende læring, med valgfri bonus;
   antall luker følger innholdet, ikke en fast kvote.
2. **Rundt én time** for kjerneoppgavene i hver løype (startverdi). Oppgaver
   over 25 minutter for en førstegangsdeltaker forenkles eller flyttes til bonus.
3. **Synlig resultat:** hver kjerneoppgave gir noe deltakeren kan se i Studio,
   spillet eller deltakeroversikten; ikke legg til luker bare for å nå et
   bestemt antall.
4. **Variasjon:** teknisk løype har høyst én oppgave som krever en ny React-
   komponent. Ikke-teknisk løype bruker ikke krav om egen kode.
5. **Bonus går dypere** uten å være nødvendig for neste luke eller finalen.

Over alle tre ukene bør teknisk løype dekke Studio, skjema, React og GROQ,
mens ikke-teknisk løype dekker publisering, strukturering og bruk av innhold.
Uke 1-forslaget under er ikke vedtatt; uke 2–3 og læringsmålene på tvers av
ukene må fortsatt revideres. Uke 1s tidligere pitch er historisk:
https://claude.ai/artifact/CgjW2uFneNYbhMvFJ4UBaF

For å vurdere en oppgave før den bygges: skillen `luke-design`
(`.claude/skills/luke-design`) og [spillvurdering.md](spillvurdering.md).

### Sanity er bygdas verksted — vedtatt retning 2026-11-10

Sanity skal løse konkrete behov i bygda, ikke bare være et sted å få en sjekk
godkjent. Flyten er: behov fra Brann → arbeid i Studio eller kode → bruk
forbedringen i eget Studio → se resultatet i Studio eller spillet.

Kodevinduet er arbeidsbenken for å forbedre Studio. Kodeoppgaver avsluttes med
å bruke forbedringen i deltakerens eget Studio, som del av samme luke, ikke
automatisk som en ekstra oppgave. Innholdsoppgaver bruker publisert innhold
som spillet faktisk leser. Sanity beskriver innholdet; spillet avgjør fortsatt
skade og andre spillregler.

**Uke 1 følger våpenlista til Brann:**

| Arbeid                             | Avslutning i Studio og spillet                                       |
| ---------------------------------- | -------------------------------------------------------------------- |
| Publiser et våpen                  | Finn våpenet i spillet og prøv det                                   |
| Ikon og preview                    | Finn igjen ditt eget våpen i den forbedrede Studio-lista             |
| Validation                         | Prøv å publisere et ugyldig våpen, rett feilen og publiser           |
| Custom input                       | Bygg visuelle spritekort med Sanity UI; publiser og se dem i spillet |
| Document view, hvis bonusen velges | Åpne visningen på ditt eget våpen i Studio                           |

Dette er krav til oppgaveutformingen, ikke en påstand om at hele flyten er
implementert. Kodetesten bekrefter kodekravene; den beviser ikke alene at
deltakeren har brukt forbedringen i Studio. Hver luke må beskrive hva som
sjekkes automatisk, og hva deltakeren blir bedt om å prøve.

**Frivillig videre spilling:** Deltakeren kan lage og endre mer innhold i
Studio og bruke det i spillet. Ingen mengdekrav som «publiser ti våpen» for å
komme videre, og ingen ekstra poeng bare for gjentatt publisering. Flere
monstre og andre innholdstyper forutsetter at støtte for dem faktisk bygges.

**Test før godkjenning:** En ny deltaker skal kunne forklare hva hen hjalp
Brann med, og hva Sanity gjorde mulig. Hvis svaret bare er «jeg bestod
sjekken», forbedrer vi koblingen til Studio før vi legger til nye belønninger
eller spillmekanikker. Test også halvferdig innhold, sletting og gjentatt
publisering uten utilsiktet fremgang.

## Oppgavene

★ oppgave, ☆ bonus. Datoene gjelder 2026.

### Uke 1: Studio (åpner mandag 30. november)

Konkrete Brann-tekster, Studio-avslutninger, lærdommer, hint og sjekkvilkår for
begge løyper står i [uke1-luker.md](uke1-luker.md). Dette er det nye
oppgaveutkastet; tabellen under beskriver fortsatt dagens sjekkmetoder.

Sjekk-kolonnen viser dagens løsning. Oppgavesettet er fortsatt et forslag;
automatisk sjekk av repo-filer ved lagring er en planlagt forbedring.

|     | Sanity-tema          | Hva deltakeren gjør                             | Sjekk                                             |
| --- | -------------------- | ----------------------------------------------- | ------------------------------------------------- |
| ★   | Documents og Publish | Lager og publiserer et våpen, ser det i spillet | Spillet                                           |
| ★   | `icon` og `preview`  | Viser ikon og sprite i dokumentlista            | Automatisk mens du skriver i kodevinduet          |
| ★   | Validation           | Påkrevd sprite for våpen, unike navn            | Automatisk mens du skriver i kodevinduet          |
| ★   | Custom input         | Visuell string selector med bildeknapper        | Kodevindu, deretter egenbekreftet Studio-prøve    |
| ☆   | Document view        | Egen fane som viser våpenet slik spillet gjør   | Repo: `npm run quest`; ved fillagring er planlagt |

**Kodevinduet i dag:** Første sjekk kjører når vinduet åpnes; deretter sjekkes
koden omtrent 300 ms etter siste endring (implementert forsinkelse). Utkastet
lagres i nettleseren, ikke i en fil i repoet. Ingen lagreknapp er nødvendig.
Bestått sjekk fullfører bare luka når den er aktiv; tidligere luker må fortsatt
være fullført.

### Produktkontrakt uke 1 — forslag, ikke vedtatt

**Felles oppstart:** Alle lager og publiserer ett våpen, og prøver det i spillet.
Dette er en kort introduksjon til Studio, ikke en poenggivende kjerneoppgave.
Da kan de to løypene ha egne læringsmål uten å hoppe over det
som trengs for å spille.

**Teknisk løype — foreløpig oppgavesett (antallet er ikke låst):**

1. `icon` og `preview`: gjør våpen gjenkjennelige i dokumentlista, og finn
   igjen ditt eget våpen i den ekte Studio-lista.
2. `validation`: krev sprite på våpen og hindre like navn; prøv feiltilfellene
   i Studio før du retter og publiserer.
3. `custom input`: bygg en visuell string selector med spritekort. Dette er
   kjerneoppgaven; kodevinduet sjekker kortene og patchene, og deltakeren
   prøver valget i Studio. Den publiserte endringen skal vises i spillet.

Kodetestene beviser ikke alene at Studio-avslutningene er utført. Utkastet i
[uke1-luker.md](uke1-luker.md) skiller mellom kode bestått, egenbekreftet
Studio-prøve og resultat som kan leses fra publisert innhold. Egenbekreftelse
etter bestått kodetest for ikon/preview og validation er vedtatt 2026-11-11,
og er nå implementert. Samme fullføringsflyt er lagt til custom input
(2026-11-12). Utkastene i kodevinduet aktiverer vår versjon i Studio, men
skriver ikke deltakerens kode til prosjektet.

`Document view` er foreløpig bonus. Felles oppstart dekker det grunnleggende
uten å være en egen poengoppgave. Oppgaver kan legges til, tas bort eller
flyttes etter testing; `custom input` er fortsatt kjerneoppgave. Document
action («Smi»-knappen) ligger i uke 3.

**Ikke-teknisk løype — foreløpige oppgaveideer (antallet trenger ikke være
det samme som i den tekniske løypa):**

Etter felles oppstart videreutvikles det samme våpenet; ingen ny samling
eller bestemt mengde dokumenter er nødvendig.

1. **Gi våpenet en beskrivelse:** bruk `Description` i Studio, publiser og
   se teksten i informasjonen om våpenet i spillet. Tema: et innholdsfelt
   brukes utenfor Studio.
2. **Oppdater samme dokument:** prøv en annen sprite som utkast, sammenlign
   med spillet og publiser. Tema: samme document beholder ID-en når innholdet
   oppdateres; utkast endrer ikke den publiserte versjonen.

Oppgavene bruker bare Studio-skjemaet og spillet, ikke kode eller terminal.
Spillet viser allerede beskrivelser og sprites fra publisert innhold.
Sjekkene for disse nye lukene må bygges: lagre en referanse ved oppgavestart
og sammenlign relevante felt på samme publiserte dokument. Vi kan ikke
automatisk bedømme om teksten er «god», eller bevise at deltakeren så på
utkastfasen. Vi må teste læringsutbytte og tidsbruk, og kan legge til, ta bort
eller flytte luker uten å kreve like mange i begge løyper.

**Poengforslag:** poeng belønner fullførte kjerneoppgaver; hint eller fasit gir
ikke poeng i seg selv, og bonus gir ikke poeng. Siden antall oppgaver kan
variere, må poengfordelingen utformes slik at en løype ikke gir mer framgang bare
fordi den har flere luker. Poeng låser ikke opp innhold. Nivågrenser er
startverdier som testes etter uke 1.

**Kalenderforslag:** uke 1 åpner mandag 30. november 2026, deretter mandag 7. og 14. desember. Åpne kapitler blir stående tilgjengelige ut desember, og
senere deltakere kan ta dem igjen.

**Deltakeroversikt — personvernforslag:** tydelig, frivillig opt-in separat
fra spilling, med avmelding/skjuling som fjerner profilen fra oversikten.
Vis bare valgt visningsnavn, figur, poeng/fremgang og uttrykkelig valgte
publiserte resultater. Ikke vis prosjekt-ID, token, privat innhold eller
sist-sett-posisjon. Deltakeren eier fortsatt sitt Sanity-prosjekt og innhold.
Eier og behandlingsansvarlig for oversiktslista må navngis og godkjennes før
innsamling; lista slettes etter kalenderen på en dato som avklares på forhånd.
Ingen token i klienten. Må godkjennes av ansvarlig for personvern før det
bygges.

Avklaringer per leveranse; åpne poeng- og personvernvalg blokkerer ikke den
vedtatte Studio-bekreftelsen:

- [ ] Felles oppstart og oppgavesettet i hver løype; antall luker fastsettes
      etter læringsmål og testet tidsbruk, og kan være ulikt mellom løypene.
- [x] Ikon/preview og validation krever bestått kodetest og «Jeg har prøvd
      dette i Studio» før neste luke åpnes (2026-11-11). Se [uke1-luker.md](uke1-luker.md).
- [ ] Poengfordeling som er rettferdig mellom løypene, bonus uten poeng og
      nivågrenser som startverdier.
- [ ] Åpningsdatoene 30. november, 7. desember og 14. desember 2026.
- [ ] Opt-in og avmelding for oversikten, hvilke felter som vises, hvem som er
      eier/behandlingsansvarlig, og når data slettes.

Document action («Smi»-knappen) flyttes til uke 3. De åpne punktene over er
fortsatt forslag til produktkontrakt; de behandles ikke som vedtatt før de er
godkjent for den aktuelle leveransen.

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

|     | Sanity-tema               | Hva deltakeren gjør                                    | Sjekk                                                  |
| --- | ------------------------- | ------------------------------------------------------ | ------------------------------------------------------ |
| ★   | Document action           | Egen «Smi»-knapp som setter et tidspunkt og publiserer | Spillet                                                |
| ★   | Portable Text             | Tekst med egne marks som vises i spillet               | Planlagt: ved fillagring i repoet og publisert innhold |
| ★   | Functions                 | Fyller et felt automatisk ved publisering (30–45 min)  | Spillet                                                |
| ★   | Offentlig dataset og GROQ | Henter en kollegas julekuler fra deres prosjekt        | Spillet                                                |
| ☆   | Custom input              | Lager tegnebrettet for julekuler selv                  | Planlagt: ved fillagring i repoet                      |

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
3. **To eller tre alternativer for uke 2 og 3,** med passende oppgavesett,
   valgfri bonus, byggekostnad og læringsutbytte. Antall luker kan variere.

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
  kapitler åpner på dato; lukene i valgt løype tas i rekkefølge, og neste luke
  åpnes først når den aktive er fullført.
- **Brann er veiviser.** Han deler ut luka og peker til stedet i bygda. Stedet
  er valgfritt; mål, hint og kodevindu er tilgjengelig fra Brann og journalen.
- **J åpner kartet.** Journalen viser luker og lærdommer via egen knapp. Kartet
  viser hvor åpne, fullførte og låste luker ligger; «Gå til» bruker den
  eksisterende klikk-for-å-gå-bevegelsen. Senere luker er låst fram til den
  aktive er fullført.
- **Mandag:** et kort med ukas oppgaver, én gang.
- **Luke ferdig:** tydelig tilbakemelding, lærdom og poeng, deretter neste luke.
- **Står fast:** vis flere hint og fasit når den er sluppet. Deltakeren kan
  lukke spillet og komme tilbake senere, men neste luke åpnes først når den
  aktive luka er fullført.
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

| Uke               | Pensum                                                                                          | Spill og gjennomføring                                                                                                            | Figur og det felles                                                    | Test                                                        |
| ----------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------- |
| 45 (3.–6. nov.)   | Lås læringsmål, rekkefølge og oppgavesett for begge løyper; antall luker følger mål og tidsbruk | Lås progresjon og flyten for hint/fasit og fullføring                                                                             | Bestem hva som vises på deltakerkort og hvem som eier fellesdata       |                                                             |
| 46 (9.–13. nov.)  | Skisser oppgaver for begge løyper i uke 1–3; test om omfang og læringsmål er realistiske        | Bygg progresjonsgrunnlaget først: løypevalg, ukentlige åpninger, luker i rekkefølge og poeng                                      | Bestem hvilke karakterer som gir oppgaver; avgjør frivillig deling     | Oppsettprøve på Mac, Windows og Codespaces                  |
| 47 (16.–20. nov.) | Ferdigstill tekst, hint, sjekk og fasit for begge løyper                                        | Ferdigstill uke 1 som en gjennomgående spillbar del, deretter kapittel 2–3; automatisk sjekk der mulig og CLI-reserve dokumentert | Bygg enkel deltakeroversikt bare hvis samtykke og datakilde er avklart | 2–3 testere fra hver målgruppe prøver uke 1 fra fersk klone |
| 48 (23.–27. nov.) | Frys omfang; klargjør kanalposter og løsningsveiledning                                         | Rett releaseblokkere; ikke legg til unødvendige mekanikker                                                                        | Slipp bare testet deltakeroversikt; utsett spøkelser/sanntid           | Begge løyper gjennomspilles; oppsettøkt og releasekandidat  |

**Hvis tiden ikke strekker til, kuttes i denne rekkefølgen:** spøkelser og
sanntid, ekstra bonusoppgaver, avansert fellesoversikt og ekstra spillmekanikk.
Begge løypene må fortsatt ha en gjennomførbar vei gjennom alle kapitlene; hvis
det ikke er realistisk, må releaseomfang eller invitasjon besluttes på nytt.

**Minimum som er godt nok:** begge løypene har en testet, sammenhengende
oppgaverekke gjennom kapitlene, med poeng/status, hint og fasit,
fungerende oppsett og en finale som virker alene. Fellesoversikten kan være
en enkel deltakerliste med opt-in profilkort.

## Risikoer

| Risiko                                  | Hva vi gjør                                                                                        |
| --------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Deltakere stopper på oppsettet          | Oppsettøkt, `npm run doctor`, Codespaces                                                           |
| Folk faller av fordi det er på egen tid | To løyper, ingen frist, kapitler åpne ut desember, hint/fasit og lagret framgang                   |
| Prosjektet slettes etter 72 timer       | Claim i oppsettøkta                                                                                |
| Oppgavene tar lengre tid enn planlagt   | Testere tar tiden; over 35 min blir bonus                                                          |
| Vi rekker ikke begge løypene godt nok   | Kutt bonus og sanntid; endre releaseomfang eller invitasjon framfor å late som begge spor er klare |
| Andres innhold får spillet til å krasje | Alt fra andre sjekkes og hoppes over hvis det ikke passer                                          |
| Noen deler upassende innhold            | Opt-in og modererings-/skjulemulighet må være avklart før deltakeroversikten åpnes                 |
| Kvoter i Sanity                         | Les andres innhold via CDN, sjeldent, og bare det vi viser                                         |
| Hemmeligheter lekker                    | Tokens bare i miljøvariabler på den lokale serveren. Claim-lenken er personlig                     |

## Beslutninger vi trenger

- [x] Tre uker, åpner mandag (2026-11-02)
- [x] Antall kjerneoppgaver er fleksibelt per uke og løype; omfang styres av læringsmål og testet tidsbruk (2026-11-10)
- [x] Frivillig og på egen tid. Ingen frist, ingen faste møter utenom oppsettøkta (2026-11-03)
- [x] Lista per uke som oversikt (2026-11-02)
- [ ] Poeng og nivå: poeng for reell fullføring, verdier og nivågrenser testes før de låses
- [ ] Kan deltakeren bytte løype etter start, og hvordan vises framgang i den andre løypa?
- [x] Alle ukene i koden fra start, datoen åpner dem (2026-11-03)
- [x] Lukeprogresjon er sekvensiell; neste luke åpnes først etter fullføring. Hint og fasit omgår ikke sjekken (2026-11-09)
- [x] Uke 1 teknisk løype: custom input er kjerneoppgave (2026-11-06)
- [ ] Ikke-teknisk løype: læringsmål og oppgaver for alle tre ukene
- [ ] Uke 2 og 3: alternativer pitches for prosjektansvarlig senest 6. november
- [ ] Fellesoversikt: hva som deles, samtykke, lagring, eier og moderering
- [ ] Poeng: belønning for fullføring; hint og fasit endrer ikke poeng
- [ ] Kanal: antakelig Viva Engage, avklares
- [ ] Skal kolleger lage oppgaver? Hvem spør vi?
- [ ] Hvor ligger deltakerlista, og hvem eier den?
- [x] Egen figur før uke 1, i en ferdig og gjennomført figurskaper (2026-11-02, bekreftet 2026-11-03)
- [ ] Hvilken grafikk bruker vi til figurene?
- [ ] Skal løsningen vises i spillet, eller bare som lenke til koden?
