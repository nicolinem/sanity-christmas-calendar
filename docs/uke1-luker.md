# Uke 1: Gjør våpenlista til Brann brukbar

Oppdatert 2026-11-12. Retningen «Sanity er bygdas verksted» er vedtatt i
[questplan.md](questplan.md#sanity-er-bygdas-verksted--vedtatt-retning-2026-11-10).
Teknisk rekkefølge er avtalt; tekst, sjekker og Studio-resultat må fortsatt
gjennomspilles. Den ikke-tekniske løypa er fortsatt et forslag. Åpne valg om
poeng og personvern står i [questplan.md](questplan.md).
Dette erstatter de løse uke-1-ideene, ikke avtalene om poeng, datoer,
løypebytte eller personvern.

**Gjeldende fullføringsregel:** Kodeoppgaver fullføres når kodesjekken består.
Deltakeren trenger ikke bekrefte at hen prøvde løsningen i Studio; en slik
prøve kan tilbys som frivillig neste steg, men lagres ikke som framgang.
Oppgave 5 (`Document view`) er tatt ut av uke 1. Innholdsoppgaver som sjekker
publiserte data, krever fortsatt publisering.

## Sammenhengen

Brann trenger en våpenliste han faktisk kan bruke. Alle publiserer først et
eget våpen. Teknisk løype forbedrer verktøyene i Studio; ikke-teknisk løype
arbeider med innholdet i den samme lista. Begge ender med noe som brukes i
Studio og spillet, ikke bare en bestått kodeøvelse.

- **Felles oppstart:** Publiser og prøv ditt eget våpen.
- **Teknisk løype:** Ikon/preview → validation → custom input. Oppgave 5,
  `Document view`, er tatt ut. Antallet er ikke en kvote.
- **Ikke-teknisk forslag:** Beskrivelse som brukes i spillet → oppdater samme
  dokument uten å publisere endringen for tidlig. Ingen kode eller terminal.
- **Frivillig videre:** Lag og endre mer innhold hvis du vil bruke det.
  Ingen krav om en samling av en bestemt størrelse, og ingen ekstra poeng for
  gjentatt publisering.

Brann og journalen gir tilgang til oppgaven. Ikke krev ekstra gåturer som
bevis på læring. De eksisterende stedene i bygda kan fortsatt vise hvor
oppgaven hører til; det nødvendige arbeidet foregår i Studio eller koden.

## Hva en sjekk betyr

**Kodeoppgaver:** Kodevinduet tester deltakerens kode på eksempler og lagrer
`solved`. Når sjekken består for en aktiv luke, fullfører spillet oppgaven;
egenbekreftelse på Studio-bruk er ikke nødvendig eller lagret. Studio slår på
vår tilsvarende løsning, med valgt ikon for preview. Deltakerens vilkårlige
kode overføres ikke til Studio. Validation bruker en falsk klient i
kodevinduet, mens vår Studio-versjon bruker det ekte datasettet.

**Frivillig Studio-prøve:** Oppgaveteksten kan foreslå at deltakeren prøver
forbedringen i eget Studio, men det er ikke en port før neste luke. Dette
gjelder ikke innholdsoppgaver der sjekken faktisk krever publiserte data.

Der vi kan lese resultatet, brukes reelt publisert innhold i stedet: bare
`source: sanity`, ikke demo- eller innebygde gjenstander. Utkast, åpning av
Studio og klikk på «Sjekk på nytt» er ikke i seg selv fullføring. En senere
feil eller sletting tar ikke tilbake en allerede opptjent fullføring.

Ingen aktiv uke-1-oppgave krever en repo-sjekk. Hvis en senere oppgave trenger
det, brukes `npm run quest`; automatisk sjekk ved fillagring er fortsatt
planlagt. Kodetestens begrensninger beskrives under hver luke.

## Felles oppstart: Publiser et våpen

**Eksisterende ID:** `the-broken-forge`; felles for begge løyper.

**Mål / Sanity-tema:** Forstå at spillet bruker publiserte documents, ikke
drafts. Felles introduksjon; ingen ny poengregel vedtas her.

> **Brann:** Stormen tok våpenlista mi. Lag et våpen i Studio og publiser det,
> så kan vi bruke det her i bygda.

**Gjør:** Opprett et `Item`, velg `Weapon`, navn og en kjent sprite. Publiser,
finn våpenet i utstyrslista og prøv det på snømonsteret.

**Automatisk i dag:** Et publisert Sanity-våpen finnes, og snømonsteret er
beseiret. Sjekken beviser ikke hvilket våpen det siste slaget brukte; ikke
påstå det. Ikke endre kampkrav eller skade som del av tekstoppgaven.

**Hintstige:** Finn `Item` i Studio → se etter `Publish` → velg våpenet i
utstyrslista før du prøver det. Dokumentasjon: [Documents](https://www.sanity.io/docs/studio/document-type).

**Lærdom:** Studio redigerer innholdet; publisering gjør det tilgjengelig for
spillet. **Resultat:** Ditt eget våpen vises og kan brukes.

## Teknisk løype

### Ikon og preview: Finn igjen våpenet

**Eksisterende ID:** `branns-ledger`. **Tema:** Presentasjon av documents i Studio.

> **Brann:** Lista viser bare navn. Vis meg bildene av våpnene, så jeg finner
> det riktige uten å åpne hvert eneste dokument.

**Gjør i kodevinduet:** Legg til et støttet ikon og en preview som viser navn
og dokumentets egen sprite. Se listen endre seg mens du skriver.

**Valgfri prøve i Studio:** Åpne den ekte dokumentlista og finn våpenet fra oppstarten.
Sammenlign med eksemplene: dette er ditt innhold i den forbedrede lista.

**Automatisk i dag:** Ikon, valg av sprite-felt og riktig navn/bilde på
eksempeldokumentene. **Fullføring:** Kodesjekken består. Studio-prøven er
frivillig og bekreftes ikke i spillet.

**Hintstige:** `icon` og `preview` styrer lista → hent `sprite` i `select` →
bruk `SpriteImage` i `prepare().media` uten å miste navnet.
[Previews](https://www.sanity.io/docs/studio/previews-list-views).

**Lærdom:** Samme dokumentdata kan få en mer nyttig presentasjon uten å endres.
**Resultat:** Bilder i både kodevinduets liste og den ekte Studio-lista.

### Validation: Stopp feil før publisering

**Eksisterende ID:** `the-guilds-law`. **Tema:** Validering av innhold.

> **Brann:** Et våpen mangler bilde, og to våpen har samme navn. La Studio
> si fra før slike feil havner på lista mi.

**Gjør i kodevinduet:** Stopp våpen uten sprite og navn som allerede er tatt.
Et materiale uten sprite og et dokument som lagres på nytt med sitt eget navn
skal fortsatt være lov. Startfila lar deltakeren skrive begge
_validation_-reglene, men har importen av `isNameTaken(...)` klar. Hjelpefanen
`guild.ts` viser funksjonen, spørringen og parameterhjelperen. De håndterer
GROQ, versjons-ID-er og draft-/release-versjoner; oppgaven er å bruke dem i en
regel og returnere en feilmelding for et navn som er tatt. Sanity-dokumentasjonen
har delen «Enforce a unique field value» med det samme mønsteret.

**Valgfri prøve i Studio:** Lag et midlertidig våpenutkast uten sprite og prøv et
eksisterende navn. Se at `Publish` blokkeres. Rett feltene, gi det et unikt
navn og publiser. Et feilaktig utkast skal ikke bli synlig i spillet.

**Automatisk i dag:** Feil og lovlige tilfeller prøves med eksempler og falsk
klient; bare warning er ikke nok. **Fullføring:** Kodesjekken består; Studio-
prøven er frivillig. Vi kan ikke utlede en avvist publisering fra det
offentlige datasettet. Organisatøren må teste vår aktiverte Studio-regel mot
et ekte prosjekt før release, inkludert upåvirket ny lagring av samme document.
Unikhetsregelen håndheves i Studio, ikke som en databasebegrensning; API-
mutasjoner omgår Studio-validering.

**Hintstige:** Start med [Sanity-dokumentasjonen om Validation](https://www.sanity.io/docs/studio/validation)
og finn «Enforce a unique field value» → se hjelpefanen `guild.ts` for
`isNameTaken(...)`, `SAME_NAME_QUERY` og `sameNameParams(...)` → nekt bare
våpen uten sprite; materialer og våpen med sprite skal passere. `rule.custom()`
kan lese `kind` gjennom `context.document`, men er ikke eneste mulige løsning.

**Lærdom:** Validation gjør det mulig å hindre feil før andre systemer leser
innholdet. **Resultat:** Synlig feilmelding i Studio, deretter et lovlig
publisert våpen i spillet.

### Custom input: Bygg en visuell spritevelger

**Eksisterende ID:** `the-drawing-board`. **Tema:** Egen input component.
Kjerneoppgave i den tekniske løypa.

> **Brann:** Jeg husker ikke hvilken sprite som er hvilken. Bygg ikonknapper
> med Sanity UI, uten synlige ID-er.

**Gjør i kodevinduet:** Startfila leser typen og gir deg sprite-ID-ene som
passer, og importerer `SpriteImage`. Deltakeren bygger selv én Sanity UI
`Button` per ID og viser spriten enten i `icon`-propen eller som barn i knappen.
Vår ferdige Studio-versjon bruker `icon` for midtstilling. `aria-label` og
`aria-pressed` finnes i vår ferdige Studio-kode, men er ikke krav i kodevinduet.
Bruk `mode` for å vise valgt verdi; ikke bruk blå `tone="primary"`.
Klikket sender `props.onChange(set(id))`; Fjern sender
`props.onChange(unset())`.

**Viktig:** Kodevinduet lagrer utkastet i nettleseren, ikke i en fil i repoet.
Når testen består, slår spillet på vår ferdige versjon av
`src/sanity/studio/SpritePicker.tsx` i Studio. Koden deltakeren skrev, blir
ikke installert eller skrevet til prosjektet.

**Valgfri prøve i Studio:** Velg et annet våpenbilde på ditt publiserte våpen, publiser
og se samme våpen med den nye spriten i spillet. Prøv også et `Material`-
dokument for å se den andre sprite-gruppa. Et gammelt valg som ikke passer til
ny type skal varsles og stoppe `Publish` til det endres eller fjernes.

**Automatisk:** Kodevinduet prøver at våpen bare viser våpensprites,
materialer og potions viser andre itemsprites, og at ingen sprites vises før
type er valgt. Det tester også markering, riktig `set(id)` og `unset()`.
Studio-prøven er frivillig og registreres ikke. Organisatøren må fortsatt
prøve valg, tastatur og publisering i et ekte Sanity-prosjekt før release.

**Hintstige:** Startfila har typefilteret; gå gjennom `spriteIds` med `.map()`
→ bygg hvert kort med Sanity UI → sammenlign ID-en med `props.value` → send
`set(id)` eller `unset()` gjennom `props.onChange`, og prøv begge typene i
Studio. Se [Visual string selector field input](https://www.sanity.io/docs/developer-guides/create-a-rich-string-selector-field-input).
For ekstra lesing: [egne Studio-komponenter](https://www.sanity.io/docs/studio/intro-to-custom-studio-components)
og [Sanity UI Button](https://www.sanity.io/ui/docs/primitive/button).

**Lærdom:** En visuell string selector gjør faste verdier lettere å kjenne
igjen, mens Sanity UI holder valgene hjemme i Studio. **Resultat:** Den
publiserte spriten vises på våpenet i spillet.

## Ikke-teknisk løype — nye luker, ikke implementert

Bruk våpenet fra oppstarten. Ingen ny dokumenttype, ingen krav om en samling,
og ingen tekstkvalitetspoeng. Feltene `name`, `kind`, `sprite` og `description`
finnes allerede. Spilleren får standard-Studio uten å måtte løse kodeoppgavene.

**Uavhengighet fra teknisk løype:** I dag aktiveres unike navn og krav om
sprite først av den tekniske validation-luka. De ikke-tekniske lukene skal
ikke forutsette at disse reglene er på, og skal ikke markere tekniske
oppgaver som løst for å få tilgang til dem. Egen innholdssjekk krever et
publisert våpen med kjent sprite der dette er relevant. Om ikke-teknisk
Studio skal leveres med flere ferdige hjelpemidler, er en egen UX-avklaring,
ikke et skjult kodekrav for spilleren.

### Innhold: Gi våpenet en beskrivelse

**Foreslått ny ID:** `describe-weapon`, løype `nonTechnical`.

**Tema:** Et innholdsfelt brukes utenfor Studio.

> **Brann:** Bildet viser våpenet, men ikke hva som gjør det til ditt. Skriv
> en kort beskrivelse, så kan vi lese den i spillet også.

**Gjør i Studio:** Finn våpenet, legg til eller endre `Description`, publiser,
og åpne informasjonen om våpenet i spillet. Innholdet er spillerens eget;
ingen bestemt formulering eller skjult «riktig» beskrivelse.

**Foreslått automatisk sjekk:** Samme valgte dokument har en publisert,
ikke-tom `description` som er forskjellig fra verdien ved oppgavestart.
Et rent mellomrom teller ikke. Spillet viser allerede beskrivelsen i
utstyrslistens tooltip; det finnes ikke en quest-sjekk for dette ennå.
Sjekken bekrefter teksten i publisert innhold, ikke at tooltipen er lest
eller at teksten er «god».

**Hintstige:** Åpne ditt eksisterende `Item` → rediger `Description` og velg
`Publish` → finn samme gjenstand i spillet og vis informasjonen.
[Documents](https://www.sanity.io/docs/studio/document-type).

**Lærdom / resultat:** Studio-feltet er innhold som spillet kan presentere,
ikke bare et felt i et skjema. Din beskrivelse vises på våpenet.

### Oppdatering: Prøv et nytt utseende før du publiserer

**Foreslått ny ID:** `update-weapon-sprite`, løype `nonTechnical`.

**Tema:** Et document beholder identiteten sin når det får en ny publisert versjon.

> **Brann:** Prøv et annet bilde på det samme våpenet. Lista mi skal ikke
> endres før du publiserer, og jeg trenger ikke et nytt dokument hver gang.

**Gjør i Studio:** Endre `Sprite` på samme våpen med standardfeltet. Se at
spillet fortsatt viser det publiserte bildet mens endringen er et utkast.
Publiser og se at det samme våpenet nå viser det nye bildet.

**Foreslått automatisk sjekk:** Dokument-ID er uendret, og publisert, kjent
`spriteId` er forskjellig fra referansen tatt ved oppstart av denne luka. Et
annet dokument, sletting og ukjent sprite med reservebilde teller ikke.
Dette bekrefter den publiserte oppdateringen, ikke at spilleren observerte
utkastfasen. Innholdssjekken og referanselagringen må bygges.

**Hintstige:** Åpne det samme dokumentet, ikke «New» → endre sprite uten å
publisere og sammenlign med spillet → publiser og sammenlign igjen.
[Documents](https://www.sanity.io/docs/studio/document-type).

**Lærdom / resultat:** Oppdateringer endrer innholdet bak samme ID. Spillet
får den nye publiserte versjonen uten at man lager en ny gjenstand.

## Regler for foreslåtte innholdssjekker

Referansedata er et lite lokalt øyeblikksbilde av valgt publisert document:
ID og relevante felt, ikke en ny backend eller en kopi av hele datasettet.
Foreslått plass er et eget `questBaselines`-felt på `Progress`, per oppgave-ID
i den eksisterende prosjektspesifikke localStorage-lagringen. Ikke gjenbruk
`solved`, som allerede betyr bestått kodeoppgave. Gamle lagringer får et tomt
referansekart uten at tidligere fullføringer endres.
Ta det først når luka er aktiv og innholdet er hentet; bevar det etter reload.
Hvis innholdet ikke kan hentes, vent med en tydelig melding, ikke ta en tom
referanse som kan gi feilaktig fullføring.

Hvis våpenet slettes før oppgaven består, be deltakeren velge et publisert
våpen på nytt og ta en ny referanse; sletting er ikke en løsning. Tidligere
fullføringer og andre løyper skal ikke slettes. En oppgave kan bare fullføres
én gang; ekstra publisering gir ingen ny belønning. Nye ikke-tekniske luker
får egne stabile ID-er, ikke de tekniske lukenes ID-er eller plassnummer.

## Vurdering før bygging

| Spørsmål   | Vurdering av utkastet                                                                           |
| ---------- | ----------------------------------------------------------------------------------------------- |
| Tydelig    | ~ Brann sier behov og sted; tekstene må fortsatt prøves av en ny deltaker.                      |
| Verdt det  | ✓ Alle lukene bruker faktisk innhold eller forbedrer Studio-verktøyet.                          |
| Svarer     | ~ Innhold vises allerede i spillet; referansesjekker og Studio-avslutninger må bygges.          |
| Belønnende | ~ Resultat i Studio/spillet pluss fullføringsvarsel er planlagt; helheten er ikke gjennomspilt. |
| Passer     | ✓ Samme våpenliste og kjente verktøy, uten nye spillbegreper eller mengdekrav.                  |

**Tidsramme:** Rundt én time per løype/uke og høyst 25 minutter per luke er
startverdier fra planen, ikke målinger av disse oppgavene. Ta tiden med
førstegangsdeltakere i begge målgruppene. Forenkle eller del en luke over
25 minutter; over 35 flyttes omfang til bonus. Ikke fyll ut en kortere løype
med gjentakelser bare for å nå en time eller samme antall luker.

**Fem prøver før godkjenning:**

- Ny deltaker: Finn Studio, gjør oppgaven og forklar hva Brann fikk hjelp med
  uten muntlig forklaring fra arrangøren.
- Stress: Halvferdig kode, bare draft, nettverksfeil, sletting, tom tekst og
  ukjent sprite gir presise meldinger uten feilaktig fullføring.
- Mestring: Bruk samme Studio-forbedring på et annet document; deltakeren skal
  kunne forklare hva som gjenbrukes, ikke bare gjenta en fasit.
- Misbruk: Bestått sjekk for en låst luke, gjentatt publisering, reload,
  et annet dokument eller demo-innhold gir ikke ekstra eller tidlig fullføring.
- Tilskuer: En som ser på, kan peke på hva som endret seg i Studio eller
  spillet og hvorfor Sanity var nødvendig.

Juster først den konkrete resultatvisningen og feilmeldingene hvis
sammenhengen er svak. Ikke legg til mer kamp, poeng eller flere oppgaver for
å skjule at Sanity-arbeidet mangler mening.

## Avklaringer og avgrensede arbeidspakker

**Besluttet 2026-11-12:** Kodebestått er nok til å fullføre; Studio-bruk skal
ikke bekreftes eller lagres. `Document view` (oppgave 5) er tatt ut. Før uke 2
og 3 utformes, skal den eksisterende progresjons- og fullføringslogikken
gjennomgås og testes samlet.

Videre arbeid deles slik når de respektive oppgavene godkjennes, uten
parallelle eiere av samme fil:

1. **Logikk først:** Hovedagent eier quest-data, progress, hook og
   fullføringsvilkår. Bevar eksisterende ID-er og fullføringer. Test rekkefølge,
   kapittelåpning, reload, kodebestått/fullført, reset og løypefilter før nye
   oppgaver kobles på. Studio-bekreftelse inngår ikke. Referanselagring bygges
   først når innholdssjekkene for den ikke-tekniske løypa godkjennes.
2. **Teknisk oppgaveagent:** Konkret tekst/hint og praktisk Studio-flyt;
   custom input som kjerneoppgave og at dagens CLI-koblingssjekk ikke kan stå
   som eneste bevis på en fungerende bildevelger. Endringer i felles quest-data
   integreres av hovedagent, ikke samtidig med andre oppgaveagenter.
3. **Ikke-teknisk oppgaveagent:** Beskrivelses- og oppdateringslukene med
   presise sjekkmeldinger; ingen schema-utvidelse eller kodekrav for spilleren.
4. **Testagent:** Ferske prosjekter, reell Studio-bruk, oppgitt tid og
   tastaturprøve. Kontroller også at hovedløypa ikke venter på bonus.

Løypevelger venter fortsatt på spillbart innhold og avklart løypebytte.
Poengverdier og felles deltakeroversikt inngår ikke i disse arbeidspakkene.
