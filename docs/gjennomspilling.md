# Gjennomspilling: uke 1

Sjekkliste for å teste luke 1–6 som en ny deltaker. Kryss av mens du spiller,
og noter det som skurrer under hvert punkt.

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
- [ ] `QUEST: Luke 2` står i `src/sanity/schemaTypes/item.tsx`.
- [ ] Etter løsningen: lista i Studio viser ikon og pikselbilde.
- [ ] `npm run quest` gir ✓, og «Sjekk på nytt» fullfører luken.
- [ ] Uten løsning gir `npm run quest` en melding som sier hva som mangler, og
      spillet viser den som «Status».

## Luke 3: Validation

- [ ] Studio nekter å publisere et våpen uten sprite (en feil, ikke en advarsel).
- [ ] Studio godtar et materiale uten sprite.
- [ ] Studio nekter et navn som en annen gjenstand allerede har.
- [ ] `npm run quest` gir ✓ med riktig løsning, og en presis melding hvis regelen
      er for streng eller bare en advarsel.

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
- [ ] Bekreft Studio-prøven i spillet. Kodevinduets utkast skrives ikke til
      repoet; det aktiverer vår versjon av komponenten.

## Luke 5: Document view

- [ ] En gjenstand har en ekstra fane, der ridderen svinger våpenet
      (`KnightPreview`).
- [ ] Visningen oppdateres mens du endrer feltene, før du publiserer.
- [ ] `npm run quest` gir ✓.

## Luke 6: Document action

- [ ] Items har en «Smi»-knapp i stedet for Publish.
- [ ] Smi publiserer og setter `forgedAt`.
- [ ] **Sanntid:** smia i spillet lyser opp idet du trykker Smi.
- [ ] Luken fullføres av seg selv (ingen `npm run quest`), og du når nivå 3.

## Etterpå

- [ ] Kalenderen (J) → «Lærdommer» viser alle seks.
- [ ] Brann sier at det ikke er flere åpne luker nå.
- [ ] «Nullstill fremgang» nederst i kalenderen starter alt på nytt, åpningen
      også.

## Notater

Skriv ned hva som var uklart, for vanskelig, for lett eller morsomt, og hvor
lang tid hver luke tok.
