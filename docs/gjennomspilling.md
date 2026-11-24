# Gjennomspilling: teknisk uke 1 og ikke-teknisk uke 1–3

Sjekkliste for felles oppstart og de tre tekniske uke-1-oppgavene.
`Document view` (tidligere oppgave 5) er tatt ut; Studio-prøving etter en
bestått kodeoppgave er frivillig og skal ikke bekreftes i spillet.

**Oppsett:** en fersk klone, `npm install`, `npm run setup`, `npm run dev` på
**port 3000** (sanntid virker bare der før prosjektet er claimet). Åpne Studio
med «Sanity Studio» øverst til høyre: det legger seg ved siden av spillet i samme
fane (dra i kanten for å endre bredde, «Egen fane» åpner det for seg).

**Snarveier:** legg til `?dev` på adressen for utviklerpanelet. Der kan du
hoppe rett til en luke, fullføre en luke med ett klikk, se alle stegene,
late som en kodesjekk er bestått, spille av effekter og nullstille. `?dev`
åpner også alle luker uansett rekkefølge og dato.

---

## 0. Første møte

- [ ] Åpningen vises: «Sanity-julekalenderen» og tre linjer. En tast eller et
      klikk starter.
- [ ] Åpningen kommer ikke igjen ved refresh.
- [ ] Hintet «Gå med WASD eller piltastene. Smia er rett nord.» står nederst, og
      forsvinner når ridderen går.
- [ ] Øverst til venstre står «Luke 1 · Snakk med Brann», og det står «!» over
      Brann.
- [ ] Ingen steg eller hint er synlige ennå. Kalenderen (J) sier «Luke 1: snakk
      med Brann».

## Luke 1: Lag og publiser et våpen

- [ ] Ved Brann: «E Snakk med Brann». E åpner samtalen.
- [ ] To sider (1/2, 2/2), E eller «Fortsett» blar. Han forklarer kalenderen og
      ber om et våpen.
- [ ] Siste side har steg-lista og «Åpne Sanity Studio», «Gå til snømonsteret» og «Lukk».
- [ ] «!» over Brann forsvinner. Øverst til venstre står «Lag og publiser et
      våpen» med to delmål.
- [ ] Første gang i Studio: innloggingslenken fra `npm run setup` slipper deg inn.
- [ ] Lag et `Item`-dokument (Name, Kind = Weapon, Sprite), trykk **Publish**.
- [ ] **Sanntid:** uten refresh stiger våpenet opp av smia, flyr til ridderen,
      og «Nytt våpen» vises. Våpenet ligger i inventarlinja.
- [ ] En draft (uten Publish) dukker _ikke_ opp i spillet.
- [ ] Snømonsteret øst for brønnen: mellomrom angriper, HP-pipsene går ned,
      «… er beseiret!».
- [ ] Toasts: «Luke 1 ferdig», «Lærdom: Draft og published», «Nivå 2: våpnene
      blir sterkere».
- [ ] Verktøytipset på våpenet viser 6 skade etter nivå 2.

## Luke 2: Ikon og preview i lista

- [ ] «!» over Brann igjen. Samtalen starter med «Bra, luke 1 er ferdig!» og
      lærdommen, så den nye oppgaven.
- [ ] Siste side: «Hvor du jobber», «Slik sjekkes det», og hint ett om gangen,
      med lenker til riktig sted i dokumentasjonen.
- [ ] Kodevinduet sjekker automatisk ikon, valgt sprite-felt og navn/preview.
- [ ] Feil løsning viser en forklaring; riktig kode fullfører luka når
      deltakeren går videre eller lukker kodevinduet.
- [ ] Studio-prøve kan gjøres frivillig; ingen bekreftelse kreves i spillet.

## Luke 3: Validation

- [ ] Studio nekter å publisere et våpen uten sprite (en feil, ikke en advarsel).
- [ ] Studio godtar et materiale uten sprite.
- [ ] Studio nekter et navn som en annen gjenstand allerede har.
- [ ] Kodevinduet sjekker både påkrevd sprite og unike navn, med presis melding
      ved feil eller for strenge regler. Varsler alene består ikke.
- [ ] Bestått kodesjekk fullfører luka; Studio-prøving er valgfri.

## Luke 4: Custom input

- [ ] Kodevinduet viser våpen-sprites i forhåndsvisningen. Velg type i Studio
      først; våpen får bare våpenbilder, materialer får de andre item-bildene.
- [ ] Velg en sprite og fjern valget. Begge handlingene må bestå kontrollen.
- [ ] Etter bestått åpnes Studio med den innebygde input-en. Tastaturfokus,
      markering, typefiltrering, valg og fjerning virker.
- [ ] Bytt type på et dokument med valgt sprite. Et uforenlig gammelt valg får
      en tydelig melding og stopper publisering til en gyldig sprite velges.
- [ ] Velg en annen sprite på det publiserte våpenet, trykk _Publish_, og se
      samme endring i spillet. Utkast vises ikke før publisering.
- [ ] Studio-prøve er valgfri; ingen bekreftelse trengs i spillet. Kodevinduets
      utkast skrives ikke til repoet; etter bestått aktiveres vår komponent.

## Etterpå

- [ ] Kalenderen (J) → «Lærdommer» viser alle fullførte uke-1-luker.
- [ ] Brann sier at det ikke er flere åpne luker nå.
- [ ] «Nullstill fremgang» nederst i kalenderen starter alt på nytt, åpningen
      også.

## Notater

Skriv ned hva som var uklart, for vanskelig, for lett eller morsomt, og hvor
lang tid hver luke tok.

---

## Ikke-teknisk løype

Bruk en fersk fremgang og et eget Sanity-prosjekt. Seed-rutene skal aldri
kjøres mot felles production. `?dev` kan åpne riktig uke, men skal ikke brukes
til å bestå sjekken under en reell gjennomspilling.

### Uke 1

- [ ] `the-broken-forge`: publiser et våpen og beseir snømonsteret.
- [ ] `weapon-description`: endre beskrivelsen etter at referanseverdien er
      tatt, publiser, og se første setning både på våpenet og ved smia.
- [ ] `apprentice-mistake`: åpne History, sammenlign revisjonene og bruk
      Studio-handlingen **Revert to revision** for å gjenopprette hammeren.
- [ ] Kontroller at drafts, tom tekst, et annet dokument og bare deler av den
      opprinnelige hammeren ikke fullfører lukene.

### Uke 2

- [ ] `archive-model`: løs alle sju kort med mus, tastatur og på 375 px bredde.
      Prøv hver feil plassering og les Arkivarens konkrete konsekvens.
- [ ] `who-is-lying`: sett fem statuser og koble den feilstavede
      bakeri-observasjonen til riktig sted. Utkast teller ikke.
- [ ] `case-file`: opprett en Case med nøyaktig de tre bekreftede
      observasjonene, publiser, og les samme saksmappe på torget.
- [ ] Kontroller reload, **Start på nytt**, feil reference, rykte i mappa og
      slettet innhold.

### Uke 3

- [ ] `baker-model`: løs kort, required- og initial-brytere med mus og
      tastatur. Lag deretter én ny bestilling; dato og «ny» skal være fylt ut.
- [ ] `baker-sign`: publiser Portable Text med ett viktig ord. Samme blokker
      skal vises på boden og som første linje i HUD-en; ordet er fett på skiltet
      og farget, ikke fett, i HUD-en.
- [ ] `morning-rush`: Brann er komplett, Arkivaren mangler dato og Kari mangler
      vare. Snakk med Kari, rett røde felt og bruk **Klar** på de tre lappene og
      bestillingen fra luke 7.
- [ ] Kontroller at **Klar** er deaktivert ved validation-feil, at vanlig
      **Publish** fortsatt er hovedknappen, og at krona kommer etter alle tre
      kjernelukene.

### Tid fra gjennomspilling

Ingen reell nettleser-/Studio-gjennomspilling er utført i denne økten. Tall
skal ikke fylles med estimater; de merkes som ikke målt til en ny deltaker har
gjennomført på eget prosjekt.

| Luke | Målt tid |
| --- | --- |
| `the-broken-forge` | Ikke målt |
| `weapon-description` | Ikke målt |
| `apprentice-mistake` | Ikke målt |
| `archive-model` | Ikke målt |
| `who-is-lying` | Ikke målt |
| `case-file` | Ikke målt |
| `baker-model` | Ikke målt |
| `baker-sign` | Ikke målt |
| `morning-rush` | Ikke målt |

### Luke-design: fem spørsmål og fem tester

`✓` er dekket i implementasjon eller automatiske tester. `~` krever fortsatt
en ny deltaker i ekte nettleser/Studio. Ingen vurdering er basert på oppdiktet
tidsbruk.

| Luke | Tydelig | Verdt det | Svarer | Belønnende | Passer | Ny deltaker | Stress | Mestring | Misbruk | Tilskuer |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `weapon-description` | ✓ konkret felt og sted | ✓ synlig på to flater | ✓ publisert endring sjekkes | ~ må oppleves | ✓ ett kjent dokument | ~ ikke prøvd | ✓ tomt/draft/annet felt testes | ~ ikke prøvd | ✓ referanse og ID låser sjekken | ~ ikke prøvd |
| `apprentice-mistake` | ✓ feil og mål er konkrete | ✓ reparerer synlig hammer | ✓ eksakte originalverdier sjekkes | ~ må oppleves | ✓ én History-handling | ~ ikke prøvd | ✓ seed/reload/ufullstendig retting testes | ~ ikke prøvd | ✓ eksisterende dokument overskrives ikke | ~ ikke prøvd |
| `archive-model` | ✓ notat, kort og brytere | ✓ slår på nyttige Studio-felt | ✓ hvert kort vurderes straks | ~ må oppleves | ✓ ett modelleringsvalg om gangen | ~ ikke prøvd | ✓ alle feilplasser og reset testes | ~ ikke prøvd | ✓ alle krav må være riktige | ~ ikke prøvd |
| `who-is-lying` | ✓ fem konkrete observasjoner | ✓ mysteriet får en løsning | ✓ publiserte statuser/references sjekkes | ~ må oppleves | ✓ bygger på modellen | ~ ikke prøvd | ✓ feil status og sted testes | ~ ikke prøvd | ✓ alle fem må stemme | ~ ikke prøvd |
| `case-file` | ✓ tre bekreftede spor | ✓ mappa vises på torget | ✓ publisert reference-array sjekkes | ~ må oppleves | ✓ ett nytt array-tema | ~ ikke prøvd | ✓ rykter og manglende spor testes | ~ ikke prøvd | ✓ nøyaktig rett sett kreves | ~ ikke prøvd |
| `baker-model` | ✓ notat og dilemma er konkrete | ✓ styrer ekte schema-adferd | ✓ brett og publisert ordre sjekkes | ~ må oppleves | ✓ kjent brett med brytere | ~ ikke prøvd | ✓ feil brytere, reset og reload testes | ~ ikke prøvd | ✓ både brett og ny ordre kreves | ~ ikke prøvd |
| `baker-sign` | ✓ én tekst på to flater | ✓ skiltet blir synlig i bygda | ✓ publisert strong-mark sjekkes | ~ må oppleves | ✓ ett Portable Text-tema | ~ ikke prøvd | ✓ tom tekst og utrygg lenke testes | ~ ikke prøvd | ✓ draft/ren URL teller ikke | ~ ikke prøvd |
| `morning-rush` | ✓ fire navngitte bestillinger | ✓ markedet blir klart | ✓ N av 4 vises | ~ må oppleves | ✓ kjent Studio + én action | ~ ikke prøvd | ✓ validering, seeding og opptelling testes | ~ ikke prøvd | ✓ akkurat fire bestemte ID-er kreves | ~ ikke prøvd |

**Juster først:** Hvis en deltaker står fast, forbedres neste steg, feilmeldingen
eller den synlige responsen før det legges til flere regler, poeng eller kamp.
