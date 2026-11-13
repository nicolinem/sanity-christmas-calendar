# Gjennomspilling: uke 1

Sjekkliste for felles oppstart og de tre tekniske uke-1-oppgavene.
`Document view` (tidligere oppgave 5) er tatt ut; Studio-prøving etter en
bestått kodeoppgave er frivillig og skal ikke bekreftes i spillet.

**Oppsett:** en fersk klone, `npm install`, `npm run setup`, `npm run dev` på
**port 3000** (sanntid virker bare der før prosjektet er claimet). Åpne Studio
med «Sanity Studio» øverst til høyre: det legger seg ved siden av spillet i samme
fane (dra i kanten for å endre bredde, «Egen fane» åpner det for seg).

**Snarveier:** legg til `?dev` på adressen for utviklerpanelet. Der kan du
hoppe rett til en luke, se alle stegene, late som en kodesjekk er bestått,
spille av effekter og nullstille. `?dev=quests` åpner i tillegg alle luker
uansett rekkefølge og dato.

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
- [ ] Siste side har steg-lista og «Åpne Sanity Studio», «Sjekk på nytt», «Gå».
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
