# Historien: snømonsteret og julemarkedet

Et forslag til plottet som driver kalenderen, og hva Brann sier underveis.
Oppgavene står i [questplan.md](questplan.md). Alt her er utkast.

Regler for teksten:

- Hver uke har ett problem i bygda, og Sanity løser det. Plottet er grunnen
  til oppgaven, ikke pynt.
- Korte replikker. Høyst to setninger før deltakeren kan gjøre noe.
- Ingen egne navn på steder. Bygda, smia, torget, skogen, bakeriet.
- Norsk tekst, Sanity-begreper på engelsk: `kode` og _term_.

---

## Kort fortalt

Det er desember, og bygda gjør seg klar til julemarkedet på torget. Men en
storm har blåst vekk smias papirliste, monstre kommer ut av skogen, og
markedet er ikke klart. Brann, smeden, ber deg om hjelp. Du bygger det bygda
trenger i Sanity Studio, uke for uke.

På julaften kommer snømonsteret til markedet. Det viser seg at det bare frøs
og var ensomt. Det får en julekule og blir med på festen.

## Personer

| Hvem             | Rolle                                            | Stemme                                |
| ---------------- | ------------------------------------------------ | ------------------------------------- |
| **Brann**        | Smeden. Gir oppgavene og forklarer hvorfor       | Varm, litt brysk, glad i orden        |
| **Bakeren**      | Har fredagskake. Deler ut løsningene på fredager | Blid, snakker om kake                 |
| **Snømonsteret** | Dukker opp i uke 2, er med i finalen             | Sier ingenting før julaften           |
| **Deg**          | Ny i bygda                                       | Sier ingenting; Brann snakker til deg |

## Før start: figuren din

Det første deltakeren gjør, før uke 1. Figurskaperen er **ferdig laget av
oss** og skal være det fineste i hele Studio. Den er ingen oppgave; den er en
smakebit på hvor langt man kan dra Studio. Senere i kalenderen lager
deltakeren sine egne, enklere varianter av det samme.

> **Brann:** Ny i bygda? Først må jeg vite hvem du er. Lag deg en figur i
> Studio, så kjenner jeg deg igjen.

Når figuren er publisert:

> **Brann:** Der er du! Visste du at det skjemaet du nettopp brukte, er laget
> med en _custom input_? Om en uke lager du din egen.

**Hvordan:** figuren er et `player`-dokument i deltakerens eget prosjekt. De
andre ser den gjennom det offentlige datasettet. Skjemaet bruker en egen
_custom input_ som ligger klar i koden, med en `QUEST`-kommentar som viser
hvor den er, så den kan leses som eksempel.

**Hva figurskaperen bør ha:**

- Stor forhåndsvisning av figuren som går og blunker, ikke et stillbilde.
- Figuren står i bygda i forhåndsvisningen, så man ser den slik den blir.
- Lag på lag: kropp, hår, klær, lue, tilbehør. Valg som bilder, ikke lister
  med navn.
- Fargeprøver for hår og klær.
- «Tilfeldig»-knapp, og angre.
- Navnet over hodet, som i spillet.
- Virker med tastatur og i både lyst og mørkt tema i Studio.
- Alt lagres som vanlige felt (`body`, `hair`, `outfit`, `colors`), så
  deltakeren kan se dataene bak og bruke dem i GROQ senere.

**Krever:** en spritepakke med figurer i lag (se «Egen figur» i
[questplan.md](questplan.md)).

**Senere tilpasning:** Kalenderen bygger videre på samme idé. Uke 1:
sprite-velger med bilder. Uke 3, bonus: tegnebrett for julekuler. Begge er
_custom inputs_, enklere enn figurskaperen.

---

## Uke 1: Smia mistet lista

**Problemet:** Stormen tok smias papirliste. Ingen vet hvilke våpen som finnes.

**Mandag**

> **Brann:** Stormen i natt tok hele lista mi. Hvert sverd, hver øks, borte
> med vinden. Denne gangen skriver vi det ned et sted som tåler vær.

| Oppgave                                   | Brann sier                                                                                            | Når den er ferdig                          |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Publiser et våpen (_document_, _Publish_) | Lag det første våpenet i Studio. Husk å trykke `Publish`, ellers ser jeg det ikke.                    | Der er det! Første våpen på den nye lista. |
| Ikon og preview (`icon`, `preview`)       | Lista er bare navn. Jeg vil se hvordan våpnene ser ut, med en gang.                                   | Nå kjenner jeg dem igjen på avstand.       |
| Regler for våpen (_validation_)           | Noen har lagt inn et sverd uten bilde. Og to våpen med samme navn. Det må stoppes før det publiseres. | Ingen flere spøkelsessverd.                |
| Velg sprite med bilder (_custom input_)   | Ingen husker hva `sword_03` er. Kan du lage en velger med bilder?                                     | Mye bedre. Selv jeg treffer riktig.        |
| ☆ Se våpenet i Studio (_document view_)   | Kunne du vist meg våpenet slik det ser ut i spillet, rett i Studio?                                   | Akkurat som i smia.                        |

**Fredag**

> **Bakeren:** Fredagskake! Og løsningene for denne uka ligger ved siden av.

---

## Uke 2: Noe kommer ut av skogen

**Problemet:** Monstre dukker opp. Ingen vet hva de er, hva de tåler, eller hva
de slipper.

**Mandag**

> **Brann:** Fotspor i snøen ved skogkanten. Store. Vi trenger en oversikt
> over hva som er der ute, før markedet åpner.

| Oppgave                               | Brann sier                                                                                  | Når den er ferdig                                                 |
| ------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Ny type for monstre (_document type_) | Våpen er én ting. Monstre er noe annet. De trenger sin egen type.                           | Nå har vi et bestiarium. Hvert monster du publiserer, dukker opp. |
| Bytte fra monstre (_reference_)       | Hvert monster slipper noe. Ikke skriv det inn på nytt; pek på gjenstandene vi allerede har. | Én gjenstand, mange monstre. Ryddig.                              |
| Finn de sterkeste (_GROQ_)            | Hvilke monstre tåler ikke ild? Finn dem i _Vision_ før de finner oss.                       | Nå vet vi hva vi skal smi.                                        |
| Din første julekule (_image_)         | Bakeren pynter treet på torget. Tegn en kule og last den opp.                               | Den henger på treet. Se, det er flere der allerede.               |
| ☆ Flere GROQ-oppgaver                 | Har du lyst på mer? Jeg har en bunke spørsmål om monstrene.                                 |                                                                   |

**Underveis:** snømonsteret blir sett i skogkanten, men forsvinner. Ingen
kamp ennå.

**Fredag**

> **Bakeren:** Kake! Og en ting til: noen har spist av julekakene mine i
> natt. Det var kaldt i bakeriet etterpå.

---

## Uke 3: Julemarkedet

**Problemet:** Markedet åpner snart. Bodene trenger skilt, smia trenger en
raskere arbeidsflyt, og treet trenger pynt fra hele bygda.

**Mandag**

> **Brann:** En uke til markedet. Vi har våpen og vi har oversikt. Nå skal
> bygda se fin ut.

| Oppgave                                        | Brann sier                                                                        | Når den er ferdig              |
| ---------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------ |
| Egen Smi-knapp (_document action_)             | Hver gang jeg smir, setter jeg tid og publiserer. To klikk for mye. Lag én knapp. | Ett trykk, ferdig smidd.       |
| Skilt til bodene (_Portable Text_)             | Skiltene trenger mer enn ren tekst. Fet skrift, priser, en liten tegning.         | Torget ser ut som et marked.   |
| Smia ordner seg selv (_Functions_)             | Kan ikke Studio fylle inn det kjedelige selv når jeg publiserer?                  | Nå jobber smia mens jeg sover. |
| Pynt fra naboene (offentlig _dataset_, _GROQ_) | Treet er for tomt. Hent kulene til en av de andre i bygda og heng dem opp.        | Det er hele bygdas tre nå.     |
| ☆ Tegnebrett (_custom input_)                  | Kunne du laget tegnebrettet for kuler selv, rett i Studio?                        |                                |

**Fredag**

> **Bakeren:** Siste fredagskake før jul. Markedet åpner mandag!

---

## Julaften: snømonsteret på markedet

Ingen nye oppgaver. Torget er pyntet, treet er fullt av kuler fra alle, og
markedet er åpent.

> **Brann:** Der er det. Det store. Hold avstand...
>
> **Brann:** Vent. Det skjelver. Det fryser jo.
>
> **Brann:** Er det deg som har spist kakene? Kom hit til varmen, da.

Snømonsteret får en julekule (deltakeren kan gi det en av sine) og blir
stående ved treet resten av desember.

> **Brann:** God jul. Takk for hjelpen i år.

---

## Sopra Steria-påskeegg

Forslag til hvor, ikke hva. Innholdet bør komme fra kolleger.

| Hvor                    | Idé                                                 |
| ----------------------- | --------------------------------------------------- |
| Bakeriet                | Fredagskake, bare på fredager                       |
| En person ved torget    | Spør «Har du ført timer i dag?» én gang i uka       |
| Skilt på husene         | Navn fra kolleger som har sagt ja                   |
| Et banner eller en katt | Sopra Steria-fargene, godt gjemt                    |
| Et hemmelig rom         | Åpnes med et internt ord eller årstall              |
| Belønning               | Finner du alle, får du et eget mønster til julekula |

Spør kolleger om én intern vits hver før start. Logo og navn er greit
internt; spør den som eier merkevaren før noe vises utenfor huset.

## Å bestemme

- [ ] Dette plottet, eller «Nissen har mistet ønskelista»?
- [ ] Skal bakeren dele ut løsningene, eller Brann?
- [ ] Skal Brann gi alle lukene, eller introduseres en ny oppgavegiver i uke 2 eller 3? Uansett skal questloggen alltid vise neste luke og hvor den gjøres.
- [ ] Skal snømonsteret ha en kamp i uke 2, eller bare bli sett?
- [ ] Hvem samler inn påskeegg fra kolleger?
- [x] Egen figur før uke 1, med en ferdig, gjennomført figurskaper (2026-11-02)
