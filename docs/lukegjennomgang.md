# Gjennomgang av lukene før lansering (26. november 2026)

Gjennomgått med `luke-design`-skillen: innhold, hint, samtaler, hvor gøy luka
er, og om sjekken stemmer. Grotta (`FEATURES.cave`) er ikke med.

> **Status 26. november:** Alle 21 funnene er rettet, men ikke committet.
> `npm test` (439 av 439) og `npm run verify-release` er grønne.
>
> - **#2:** Knappen heter *Revert to revision* i Studio 6.20 (sjekket i
>   Sanity-pakken). Bare den tomme «@initial»-tilstanden er sperret, ikke
>   versjonen der hammeren ble laget.
> - **#14:** Følger dokumentasjonen: `documentEventHandler`, `event.data`,
>   klient fra `context.clientOptions` og en låst `sanity.blueprint.ts`.
> - **#15:** Smi må være grå for alt annet enn våpen.
>
> Ingenting er spilt i nettleseren.
>
> **Testet i Studio samme dag (#1):** Det første oppsettet («Created» og så
> «Live edited») gir to punkter i *History*, så det virker. Men to vanlige
> endringer rett etter hverandre ble slått sammen til ett «Live edited». Da
> kunne ikke den riktige versjonen velges, og den første rettelsen av #1
> virket ikke. Nå legges den riktige hammeren inn som en publisering (utkast,
> så *Publish*), og feilen som en vanlig endring. Det gir to punkter. Hele
> veien er prøvd med Studio 6.20: *History* › «Published» › *Revert to
> revision* › bekreft › bytt til *Draft* › *Publish*. Spillet viste «Brann sin
> hammer» etterpå.

**Slik er det gjort:** Jeg har lest koden og dataene: `chapters.ts`,
modellbrettene, kodevinduets oppgaver, Studio-skjemaene, `structure.ts`,
`BakeryActions.ts`, seed-rutene og `village.ts`. Jeg har sjekket fakta mot
Sanity-dokumentasjonen: *History*, tre dagers historikk på Free-planen,
Functions og *document actions*. Jeg har **ikke** spilt gjennom i nettleseren.
Når en luke gis, skriver spillet til Sanity-prosjektet ditt (hammeren,
observasjonene og bestillingene), og det skal ikke skje uten at du har sagt ja.
Det jeg ikke har sett selv, er merket *ikke sett i nettleser*.

**Merkene:**

- **Før 1. des.** gjelder uke 1, som åpner tirsdag.
- **Før uka åpner** gjelder uke 2 (7. des.) og uke 3 (14. des.).
- **Kan vente** er pussing.

Funnene står i rekkefølge etter hvor mye de betyr for en deltaker.

---

## Det viktigste, kort

| # | Luke | Problem | Når |
|---|---|---|---|
| 1 | Ikke-teknisk luke 3 (*History*) | Den riktige versjonen forsvinner fra *History* etter tre dager. Den som henter luka og kommer tilbake senere, står fast for godt | Før 1. des. |
| 2 | Teknisk luke 11 (Function) | Lærer et API som ikke finnes (`event.transition`, `event.document`, `on: publish`) | Før uke 3 |
| 3 | Ikke-teknisk luke 4 (modellbrett) | Avslutningen ber deg se feltene i Studio, men lista er tom fordi observasjonene først legges inn i luke 5 | Før uke 2 |
| 4 | Ikke-teknisk luke 7 (modellbrett) | Ingenting sier at kunden kan være ukjent, så «Påkrevd» på kunden blir gjetting. Hintene står i feil rekkefølge, og notatet sier «fredag» mens Bakeren sier «i dag» | Før uke 3 |
| 5 | Ikke-teknisk luke 9 (Morgenrushet) | Ingen sier hvor Kari står. Hint 2 er svakere enn hint 1. «Markedet åpner om ti minutter» krasjer med resten av historien | Før uke 3 |
| 6 | Ikke-teknisk luke 5–6 | Markedet blir «reddet» to ganger: både i luke 5 og i luke 6 | Før uke 2 |
| 7 | Teknisk luke 10 (Smi) | Nesten ingenting å gjøre, og regelen om materialer, som Studio viser, testes ikke | Før uke 3 |
| 8 | Flere luker | Samme poeng står tre–fire ganger (`explain.why`, `outro`, `lesson`, `atWork`) | Kan vente |

---

## Ikke-teknisk spor, uke 1 (Brann)

### 1. Luke 3 «Lærlingen rotet»: den riktige versjonen kan forsvinne fra History · **Før 1. des.**

- **Hvor:** `src/components/GameClient.tsx:1083-1096`,
  `src/app/api/apprentice/route.ts:31`, `src/game/apprentice.ts:21`
- **Hva er galt:** Hammeren legges inn i det øyeblikket luka blir gitt, som to
  skrivinger rett etter hverandre. Free-planen husker historikk i tre dager
  ([History experience](https://www.sanity.io/docs/user-guides/history-experience):
  «Free: 3 days»). Gis luka tirsdag og løses mandag, er den riktige versjonen
  borte. Sjekken krever nøyaktig beskrivelse («En solid smiehammer som Brann
  bruker til å forme våpen for vinteren.»), og den står ingen steder for
  deltakeren. Da kan luka ikke løses.
- **Forslag:** Når luka er aktiv, hammeren ikke er rettet, og den siste
  endringen (`_updatedAt`) er mer enn to døgn gammel: skriv de to versjonene på
  nytt (riktig først, så lærlingens feil). Det er samme rute med én betingelse
  til. Da finnes det alltid en riktig versjon i *History*.
- **Også, ikke sett i nettleser:** Lager to skrivinger noen millisekunder fra
  hverandre to egne punkter i *History*, eller slår Studio dem sammen? Prøv i
  et ferskt prosjekt før tirsdag.

### 2. Luke 3: to navn på samme knapp · **Før 1. des.**

- **Hvor:** `chapters.ts:254`, `:291`
- **Hva er galt:** Steget sier «trykk *Revert to revision* (Restore)», og
  `lesson` bruker *Revert to revision*. Dokumentasjonen bekrefter at *History*
  ligger i menyen med tre prikker, men sier ikke hva knappen heter. Med to navn
  vet ikke deltakeren hva hen skal se etter.
- **Forslag:** Åpne *History* i Studio 6.20 og bruk det knappen faktisk heter,
  ett navn alle steder. Sannsynligvis:
  > Velg en versjon fra før lærlingen var der, og trykk *Restore*.

### 3. Luke 2 «Samme tekst, to steder»: «i går» passer ikke · **Før 1. des.**

- **Hvor:** `chapters.ts:153`
- **Hva er galt:** Luka kan åpnes minutter etter at våpenet ble laget i luke 1.
  Da kan ingen kunde ha stått foran tavla «i går».
- **Forslag:**
  > Isted sto en kunde lenge foran tavla i smia. Der står bare navnet på våpenet, så hun skjønte ikke hva det var godt for, og gikk uten å kjøpe noe.

  Det samme gjelder luke 3 (`:239`, «i går kveld»). Der går det, fordi
  lærlingen kan ha vært der før deg, men «i natt» er tryggere.

### 4. Luke 2: hint 3 peker på feil våpen · **Kan vente**

- **Hvor:** `chapters.ts:185`; sjekken er `useQuests.ts:52-63`
- **Hva er galt:** Sjekken bruker våpenet som var utstyrt da Brann ga luka.
  Hintet sier «våpenet du har utstyrt», og det kan ha blitt byttet siden.
  Journalen viser riktig navn (`goal` med «${weapon.name}»).
- **Forslag:**
  > Står det fortsatt ingenting nytt på tavla? Se i journalen (J) hvilket våpen luka gjelder, og skriv på det. Husk *Publish*, for et utkast vises ikke.

### 5. Luke 2: hint 1 gjentar oppgaven · **Kan vente**

- **Hvor:** `chapters.ts:178`
- **Hva er galt:** At tavla viser første setning, står allerede i `explain.what`.
  «Tenk som en selger» hjelper ingen som står fast.
- **Forslag:** Gjør dagens hint 2 (hvor feltet er) til hint 1. Nytt hint 2:
  > Usikker på hva du skal skrive? Svar på det kunden lurte på: hva er våpenet godt for? «Godt mot snømonstre, og lett nok til å svinge med én hånd.»

### Fem spørsmål, uke 1

| Luke | Tydelig | Verdt det | Svarer | Belønnende | Passer |
|---|---|---|---|---|---|
| 1 Lag et våpen | ✓ | ✓ første våpen i bygda | ✓ live | ✓ kamp + luke | ✓ |
| 2 Samme tekst | ~ hint 1 er svakt | ✓ tavla og tingene dine | ✓ | ~ bare tekst endres | ✓ |
| 3 Lærlingen | ~ to navn på knappen | ✓ hammeren blir hel | ✗ etter tre dager | ✓ «banan banan» er morsomt | ✓ |

---

## Ikke-teknisk spor, uke 2 (Arkivaren)

### 6. Luke 4 «Rydd notatene»: Studio er tomt når du skal se resultatet · **Før uke 2**

- **Hvor:** `chapters.ts:737`, `src/components/GameClient.tsx:1036-1045`,
  `src/sanity/studio/structure.ts:84-99`
- **Hva er galt:** Avslutningen sier «Åpne Studio og se: valgene dine er blitt
  feltene i *Observation*». Men observasjonene legges bare inn når luke 5 eller
  6 er aktiv. Rett etter luke 4 viser lista «Observations» ingenting, med mindre
  sideoppdraget «Det Kari så» er i gang. Øyeblikket der deltakeren skulle se at
  modellen ble ekte, blir en tom liste. *Ikke sett i nettleser.*
- **Forslag:** Legg `"archive-model"` til i lista i `needsArchive`
  (`GameClient.tsx:1043`). Da finnes de fem observasjonene mens luke 4 pågår,
  med feltene skjult (`hideModeledField`), og feltene dukker opp når brettet er
  løst. Det er en enda bedre «aha».

### 7. Luke 4: notatet stemmer ikke med observasjonen, og en tilbakemelding motsier notatet · **Før uke 2**

- **Hvor:** `src/components/hud/modelBoard/tasks/archiveModel.ts:5`, `:50`, `:82`, `:71`
- **Hva er galt:**
  - Notatet sier «21:40», men det er observasjon A (Kari, fotspor ved smia,
    bilde), og den er 18:45 (`archive.ts`). Det finnes heller ikke noe kort
    for klokkeslettet.
  - Feil plass for «fotspor i snøen» → Bilde svarer «Jeg har ikke selve
    bildet». Men notatet sier at Kari tok bilde.
  - «Fritekst kan ikke sorteres» stemmer ikke. Det er filtrering regelen
    trenger.
  - *et annet vitne* er markert som Sanity-begrep, men er det ikke.
- **Forslag:**
  - `note`: «Arkivarens notat: «18:45 – fotspor i snøen ved smia, tror jeg. Kari så det selv, tok bilde. Ikke sjekket.»»
  - `:50`: «Bildet har sitt eget kort. Her er det ordene hennes jeg vil ta vare på.»
  - `:82`: «Regelen min spør bare om én ting: så hun det selv, ja eller nei? Med fritekst får jeg «ja», «Ja» og «tror det».»
  - `:71`: «Regelen min sier «et annet vitne». Står navnet som tekst, blir «Kari» og «kari» to forskjellige vitner.»

### 8. Luke 5 og 6: markedet blir reddet to ganger · **Før uke 2**

- **Hvor:** `chapters.ts:790`, `:863`
- **Hva er galt:** Avslutningen på luke 5 sier «Markedet blir ikke avlyst på
  grunn av sladder». Luke 6 begynner med at folk på torget krangler, og ender
  med «Markedet går som planlagt». Første gang tar spenningen fra luke 6.
  Avslutningen på luke 6 er dessuten fire setninger før poenget om
  *references*.
- **Forslag:**
  - Luke 5, `outro[0]`:
    > Nå vet jeg hva som er fakta og hva som er rykter. Men folk på torget tror fortsatt på det de har hørt.
  - Luke 6, `outro[0]`:
    > Saksmappa henger på torget, og krangelen har stilnet. Store fotspor ved smia og en revnet melsekk ved bakeriet, og ingen ble skadet. Markedet går som planlagt.

### 9. Luke 5 «Hvem lyver?»: hint 1 gjentar regelen, og hint 3 bommer litt · **Før uke 2**

- **Hvor:** `chapters.ts:811`, `:818`
- **Hva er galt:** Hint 1 er regelen fra intro, sagt på nytt. Hint 3 sier «se
  på navnet». Men D («Bjella ringte av seg selv») er et rykte først og fremst
  fordi ingen andre så det samme. At vitnet også er Ola, kommer i tillegg. Det
  vanskelige er å sammenligne B, C og D, og det hjelper ingen av hintene med.
- **Forslag:**
  1. > Start med de som står alene. A har bilde, og E er hørt fra andre. Da gjenstår tre ved Bakeriet.
  2. > Åpne «Per sted» › Bakeriet. Så noen *det samme* der?
  3. > B og C så det samme, og de er to ulike vitner. D er det bare Ola som har sett.

  Liten ting i intro (`:786`), som er stiv:
  > Det er fem historier hele bygda snakker om. Men under Bakeriet mangler én av dem, for noen skrev «bakriet».

### 10. Luke 6 «Saksmappa»: hintene hjelper ikke med det som er nytt · **Kan vente**

- **Hvor:** `chapters.ts:883-890`
- **Hva er galt:** Lista heter «Bare bekreftede» i Studio, ikke «Bekreftede».
  De tre hintene handler om kanttilfeller. Ingen av dem hjelper med det nye,
  nemlig å velge en *reference* i en liste.
- **Forslag:**
  1. > Lista «Bare bekreftede» i Studio viser hvilke observasjoner som skal med.
  2. > Trykk *Add item* under *Observations*, og skriv noen bokstaver av det som ble sett, for eksempel «fotspor». Velg treffet.
  3. > Ser spillet ingen saksmappe? Da er den bare et utkast. Trykk *Publish*. Har du flere, ser spillet på den som er nærmest riktig.

### Fem spørsmål, uke 2

| Luke | Tydelig | Verdt det | Svarer | Belønnende | Passer |
|---|---|---|---|---|---|
| 4 Rydd notatene | ✓ god tilbakemelding per feil | ✗ tom Studio etterpå (#6) | ✓ hvert kort straks | ~ | ✓ |
| 5 Hvem lyver? | ~ hintene | ✓ den beste ikke-tekniske luka | ✓ | ✓ | ✓ |
| 6 Saksmappa | ✓ | ✓ tavla på torget, rename-trikset | ✓ | ✓ | ~ tynn, men grei |

---

## Ikke-teknisk spor, uke 3 (Bakeren)

### 11. Luke 7 «Hva er en bestilling?»: kunden blir gjetting, og hintene står i feil rekkefølge · **Før uke 3**

- **Hvor:** `chapters.ts:1067`, `:1093-1105`;
  `src/components/hud/modelBoard/tasks/bakerModel.ts:5`, `:18`, `:63`
- **Hva er galt:**
  - Det eneste ekte valget er at «Bestilt av» *ikke* skal være påkrevd. Det
    står ingen steder før hint 2, som da gir svaret («Kunden er det ekte
    dilemmaet»). Det er dessuten meta-språk, ikke Bakerens stemme.
  - Hint 3 forklarer hva «Påkrevd» og «Startverdi» betyr. Det trenger man
    *før* man kan bruke hint 1 og 2.
  - Notatet sier «fredag». Bakeren sier at datoen «nesten alltid er i dag», og
    startverdien er i dag.
  - Notatet gjentar også intro («skriver status og dato om igjen …»).
  - Kortene er nesten gitt: to av fire går til Tekst, og det finnes bare tre
    plasser. Det er greit når bryterne er selve oppgaven, men da må bryterne
    være tydelige.
- **Forslag:**
  - Intro `[1]`:
    > Samtidig skriver jeg dato og «ny» på hver lapp, enda datoen nesten alltid er i dag og alt starter som ny. Varen vet jeg aldri på forhånd, og iblant bestiller noen uten å si hvem de er.
  - `note`: «Bakerens notat: «Lussekatter til Brann, i dag. Ny.»». Kortet
    `date` blir «i dag», og `:63` blir: «Står «i dag» bare som tekst, kan jeg
    ikke sortere bestillingene etter dato.»
  - Hint, i ny rekkefølge:
    1. > «Påkrevd» stopper *Publish* når feltet er tomt. «Startverdi» fyller ut feltet når en ny bestilling lages, og du kan endre det. Et felt kan ha begge.
    2. > Startverdi passer bare for det Bakeren vet før kunden sier noe: hvilken dag det er, og at alt starter som ny.
    3. > Vare, dato og status må alltid være med. Kunden må ikke det, for noen bestiller uten å si navnet sitt.

### 12. Luke 9 «Morgenrushet»: hvor er Kari, og når åpner markedet? · **Før uke 3**

- **Hvor:** `chapters.ts:1204`, `:1209`, `:1220`, `:1230-1239`;
  `src/game/village.ts:268`; `src/components/hud/nextStep.ts`
- **Hva er galt:**
  - Neste steg-knappen sier «Åpne Sanity Studio», og ingen tekst sier at Kari
    står ved huset vest i bygda. Bare kartet viser det.
  - «Markedet åpner om ti minutter» passer ikke med åpningen av uke 3 («få
    dager igjen») og julaften, når markedet faktisk åpner.
  - Hint 2 («Det er *validation* som sier fra») er svakere enn hint 1, og det
    sier ikke hvor svaret er.
  - Kari svarer «Julekake, selvfølgelig!» uten at spørsmålet er stilt.
- **Forslag:**
  - Intro `[0]`:
    > Om ti minutter kommer kundene for å hente, og fire bestillinger ligger fortsatt på benken: Branns, Arkivarens, Karis og den du la inn.
  - Intro `[1]`:
    > To av lappene er ufullstendige. Arkivaren glemte datoen, og jeg får ikke lest hva Kari skrev. Hun står ved huset vest i bygda, så spør henne.
  - Outro `[0]`:
    > Alle fire er klare, og kundene kan hente!
  - Hint:
    1. > Begynn med lappene som har røde felt. Det er der noe mangler. Holder du musa over *Klar*, ser du hva.
    2. > Arkivarens dato kan du fylle inn selv. Karis vare vet bare Kari. Hun står ved huset vest i bygda.
    3. (som i dag) Har du trykket *Publish* i stedet? …
  - Kari (`village.ts:268`):
    > Bestillingen min? Julekake, selvfølgelig! Det er det samme hvert år.
  - *Ikke sett i nettleser:* om `title` på en grå *Klar* faktisk vises når
    knappen ligger i menyen ved *Publish*. Dokumentasjonen sier ikke noe om det.
    Gjør den ikke det, må hint 1 skrives om.

### 13. Luke 8 «Bodskiltet»: «i går» og «i dag» i samme setning, og et felt ingen bruker · **Kan vente**

- **Hvor:** `chapters.ts:1145`; `src/sanity/schemaTypes/bakerySign.ts:18-27`
- **Hva er galt:** «I går gikk folk forbi … Ingen visste at det var nystekt i
  dag» henger ikke sammen. Skiltet har også en lenke-*annotation* som ingen
  luke bruker. Bonusluka `baker-link` finnes ikke lenger. Et felt uten
  betydning bryter regelen «et felt finnes bare hvis valget betyr noe».
- **Forslag:**
  > I går gikk folk rett forbi boden min. Ingen så at brødet var nystekt.

  Fjern `annotations` fra skiltet, eller la den stå til lenke-luka kommer
  tilbake. Selve luka er lett (gjør ett ord fet). Det er greit for luke 8 i
  ikke-teknisk spor, siden belønningen er at to flater viser det forskjellig.

### Fem spørsmål, uke 3

| Luke | Tydelig | Verdt det | Svarer | Belønnende | Passer |
|---|---|---|---|---|---|
| 7 Bestilling | ✗ kunde-valget er skjult (#11) | ✓ Studio endrer seg | ✓ | ~ | ✓ |
| 8 Bodskiltet | ✓ | ✓ skiltet i bygda | ✓ | ✓ to flater | ✓ lett |
| 9 Morgenrushet | ~ Kari (#12) | ✓ | ✓ «N av 4» | ✓ ut i bygda + Studio | ✓ den beste i uke 3 |

---

## Teknisk spor, uke 3 (Bakeren)

### 14. Luke 11 «Sanity Function»: lærer et API som ikke finnes · **Før uke 3**

- **Hvor:** `src/components/hud/codeWindow/tasks/bakerFunction.tsx:3-21`,
  `:74-80`; `chapters.ts:1040`, `:1052`
- **Hva er galt:** Startfila bruker `onOrderPublished(event, { client })`,
  `event.transition` og `event.document`. Sanity Functions ser slik ut
  ([function-quickstart](https://www.sanity.io/docs/functions/function-quickstart),
  [function-wrapper](https://www.sanity.io/docs/functions/function-wrapper)):
  - `export const handler = documentEventHandler(async ({ context, event }) => …)`
  - dokumentet ligger i `event.data`
  - hvilke hendelser som kjører funksjonen, står i blueprinten
    (`on: ["create", "update"]`, `filter: '_type == "bakeryOrder"'`), ikke i
    koden
  - det finnes ingen `publish`-verdi for `on`

  Den som prøver dette på jobb, skriver feil kode. Vakten mot dobbeltarbeid er
  et godt poeng og kan stå.
- **Forslag:**
  - Gi startfila samme form som den ekte, med en liten falsk
    `documentEventHandler`:
    ```js
    export const handler = documentEventHandler(async ({ context, event }) => {
      const order = event.data
      // Sjekk at bestillingen har en vare.
      …
    })
    ```
  - Vis blueprinten som en låst referansefil i kodevinduet:
    `on: ["create", "update"]`, `filter: '_type == "bakeryOrder"'`.
  - Krav 2 blir «Ignorer bestillinger uten vare», og krav 3 står som i dag.
  - Hint 1:
    > Blueprinten bestemmer allerede at bare `bakeryOrder` kommer hit. Du må passe på at bestillingen faktisk har en vare.
  - `lesson`:
    > En Function får dokumentet i `event.data` og en *client*. Blueprinten bestemmer hvilke endringer som kjører den; koden bestemmer om den skal gjøre noe. Her kjørte funksjonen din i nettleseren og skrev bare til skiltet i bygda. En ekte Function deployes med `sanity blueprints deploy`.

  Funksjonen kjøres også mot ekte bestillinger i `useOrderFunction.ts`, så
  husk å endre den også. Løsningen på `solutions` må lages på nytt.

### 15. Luke 10 «Document action: Smi»: for lite å gjøre, og regelen Studio viser testes ikke · **Før uke 3**

- **Hvor:** `src/components/hud/codeWindow/tasks/bakerForge.tsx:19-31`,
  `:62-76`; `chapters.ts:995`, `:1008`
- **Hva er galt:**
  - Startfila har allerede `useDocumentOperation` og `label: "Smi"`. Det som
    gjenstår, er to linjer, og hint 3 gir begge.
  - Hint 2 gjentar det som står i startfila.
  - `studioPractice` sier «Et materiale skal ikke kunne smis», men koden til
    deltakeren blir aldri testet på det.
  - Dokumentasjonens eksempel kaller `props.onComplete()`
    ([document-actions](https://www.sanity.io/docs/studio/document-actions)),
    og det gjør ikke oppgaven.
- **Forslag:** Legg til ett krav: «Bare våpen kan smis». `disabled` skal være
  sann når `(props.draft ?? props.published)?.kind !== "weapon"`. Test det med
  et materiale i `judgeBakerForge`. Bytt hint 2 til:
  > `props.draft` (eller `props.published`) er dokumentet. Returner `disabled: true` når det ikke er et våpen.

  Ta med `props.onComplete()` i løsningen, men ikke som krav. Da blir luka en
  ekte *document action* (`label`, `disabled`, `onHandle`), og ikke bare
  utfylling.

### 16. Luke 10: Bakeren gir en smie-luke · **Kan vente**

- **Hvor:** `chapters.ts:971-972`
- **Hva er galt:** Bakeren gir videre en beskjed fra Brann. Det fungerer, men
  det er rart at Bakeren gir luka når Brann står ved smia.
- **Forslag:** Behold det, men gjør det naturlig:
  > Brann kom innom med sot på hendene. Han hadde smidd et nytt sverd, men glemt å trykke *Publish*, så kunden sto og ventet forgjeves.
  > Han spurte om du kan lage én Smi-knapp i Studio, en *document action*, som stempler `forgedAt` og publiserer i samme trykk.

### Fem spørsmål, teknisk uke 3

| Luke | Tydelig | Verdt det | Svarer | Belønnende | Passer |
|---|---|---|---|---|---|
| 9 Faste kunder | ✓ | ✓ malene i +-menyen | ✓ | ✓ | ✓ |
| 10 Smi | ✓ | ~ for lett (#15) | ✓ | ✓ smia blusser | ✓ |
| 11 Function | ✓ | ✗ feil API (#14) | ✓ | ✓ skiltet endrer seg | ✓ |

---

## Teknisk spor, uke 1–2 (sett over; stort sett greit)

### 17. Luke 4 «Custom input»: hjelpelinjer som ikke hjelper · **Kan vente**

- **Hvor:** `chapters.ts:463`, `:474-475`
- **Hva er galt:** Disse gir ingen ny informasjon:
  - «Nysgjerrig på egne Studio-komponenter? Les gjerne videre, men du trenger
    det ikke …»
  - «I vår ferdige Studio-kode brukes `icon`-propen …»
  - «Du trenger ikke legge til `aria-label` …»
- **Forslag:** Stryk de tre setningene. Lenketeksten «(ekstra lesing)» sier det
  samme.

### 18. Luke 3 «Validation»: Kari kan knytte ukene sammen · **Kan vente**

- **Hvor:** `chapters.ts:375`
- **Forslag:** Kari bor i huset vest, er vitne i uke 2 og kunde i uke 3.
  > Kari i huset vest for brønnen bestilte ei øks, men to våpen hadde samme navn. Et av dem manglet også bilde, så jeg visste ikke hvilket hun mente.

Ellers fant jeg ikke noe å rette i teknisk uke 1–2. Hintene i luke 5–7 går
fra hint til nesten-svar, og sjekkene i kodevinduet stemmer med oppgaveteksten.

---

## På tvers av lukene og ukene

### 19. Uke 3 åpner med «i natt» om noe som skjedde for en uke siden · **Før uke 3**

- **Hvor:** `chapters.ts:1307`
- **Forslag:**
  > Jeg er Bakeren. Noen var i bakeriet mitt forrige uke, men takket være deg og Arkivaren blir ikke markedet avlyst!

### 20. Samme poeng tre–fire ganger · **Kan vente**

- **Hvor:**
  - luke 2: `chapters.ts:158`, `:163`, `:198-200`
  - luke 3: `:249` og `:293`
  - luke 8: `:1150`, `:1155`, `:1186`
- **Hva er galt:** `explain.why`, `outro`, `lesson.text` og `atWork` sier nesten
  det samme. Skillen sier at `outro` ikke skal gjenta `lesson` og `atWork`.
  Luke 8 bruker dessuten "rette" anførselstegn i `atWork`, der resten bruker
  «».
- **Forslag:** La `outro` bare si hva som skjedde i bygda, og stryk siste
  setning der:
  - luke 2 `outro[1]`
  - luke 8 `outro[1]`

  La `explain.why` si hvorfor *Brann* trenger det, og `atWork` si hvorfor *du*
  trenger det på jobb. Rett anførselstegnene i luke 8 til «viktig».

### 21. `docs/historie.md` beskriver en gammel plan · **Kan vente**

Den har monster-bestiarium i uke 2 og Brann som eneste giver, så den villeder
den som skriver neste tekst. Merk den som utgått, eller oppdater
ukeoversikten etter `chapters.ts`.

---

## Ikke sjekket

- Ingen luke er spilt gjennom i nettleseren eller i Studio. Det står fortsatt
  «Ikke målt» for tid i `docs/gjennomspilling.md`.
- Hva knappen i *History* heter i Studio 6.20 (#2), og om to raske skrivinger
  blir to punkter i *History* (#1).
- Om tooltip på en grå *Klar* vises i menyen (#12).
- Om `newDocumentOptions` også skjuler «Bestilling fra …» i +-knappen inne i
  lista «Ny bestilling», og ikke bare i den globale +-knappen. Hvis ikke, ser
  ikke-teknisk spor (og teknisk spor før luke 9) ferdige maler for tidlig.
- Jeg har ikke endret noen filer bortsett fra denne rapporten.
